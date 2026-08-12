import assert from 'node:assert/strict';
import test from 'node:test';

import { GameState } from '../js/core/GameState.js';
import { config } from '../js/core/config.js';
import { OfflineManager } from '../js/systems/OfflineManager.js';
import { WorkerManager } from '../js/systems/WorkerManager.js';

function withBrowserEnvironment(run) {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new Map();
  const listeners = new Map();

  globalThis.window = {
    addEventListener(event, listener) {
      const callbacks = listeners.get(event) || new Set();
      callbacks.add(listener);
      listeners.set(event, callbacks);
    },
    removeEventListener(event, listener) {
      listeners.get(event)?.delete(listener);
    },
  };
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };

  try {
    return run({ storage, listeners });
  } finally {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  }
}

test('resource tiers match the first era where each displayed resource appears', () => {
  const firstEraByResource = new Map();
  config.eraOrder.forEach((era, eraIndex) => {
    for (const resource of config.resourcesByEra[era] || []) {
      if (!firstEraByResource.has(resource)) firstEraByResource.set(resource, eraIndex);
    }
  });

  for (const [resource, firstEra] of firstEraByResource) {
    assert.equal(config.resourceEra[resource], firstEra, `${resource} has the wrong era tier`);
  }
});

test('each playable era has one canonical definition', () => {
  assert.equal('eras' in config, false);

  for (const era of config.eraOrder) {
    const definition = config.eraData[era];
    assert.equal(definition?.id, era);
    assert.ok(definition?.name);
    assert.ok(definition?.description);
  }
});

test('population requirements are thresholds and are not spent', () => {
  const state = new GameState();
  state.data.resources = { population: 8, sticks: 15, stones: 10 };

  assert.equal(state.spendResources({ population: 8, sticks: 5 }), true);
  assert.equal(state.getResource('population'), 8);
  assert.equal(state.getResource('sticks'), 10);
});

test('restoring workers schedules timers without granting a free work cycle', () => {
  const state = new GameState();
  state.data.workers = { gatherer: 2 };
  const manager = new WorkerManager(state);
  manager.setGameManager({
    getCurrentEraData: () => ({ workers: [{ id: 'gatherer', interval: 4000 }] }),
  });

  const starts = [];
  manager.stopAllWorkers = () => {};
  manager.startWorkerAutomation = (...args) => starts.push(args);
  manager.restartAllWorkers();

  assert.equal(starts.length, 1);
  assert.equal(starts[0][0], 'gatherer');
  assert.deepEqual(starts[0][2], { runImmediately: false });
});

test('offline chain workers cannot produce without their required inputs', () =>
  withBrowserEnvironment(({ storage }) => {
    const state = new GameState();
    state.data.workers = { smelter: 1 };
    state.data.resources = { population: 1 };
    storage.set('lastActive', String(Date.now() - 10 * 60 * 1000));

    const offline = new OfflineManager(state);
    const workerData = {
      id: 'smelter',
      interval: 1000,
      consumes: { iron: 1 },
      produces: { steel: 2 },
    };
    const gameManager = {
      systems: {
        workerManager: {
          getEffectiveInterval: () => 1000,
          getDiminishingReturnsFactor: () => 1,
          getSoftCapMultiplier: () => 1,
        },
      },
      getCurrentEraData: () => ({ workers: [workerData] }),
      getPopulationCapacity: () => 50,
      getPopulationFoodFactor: () => 1,
      getPopulationWorkerLoadFactor: () => 1,
      getSpecializationMultiplier: () => 1,
      getWorkerSpecializationMultiplier: () => 1,
    };

    const result = offline.applyOfflineProduction(gameManager);
    assert.deepEqual(result.produced, {});
    assert.equal(state.getResource('steel'), 0);

    state.data.resources.iron = 0.5;
    storage.set('lastActive', String(Date.now() - 10 * 60 * 1000));
    const partialInputResult = offline.applyOfflineProduction(gameManager);
    assert.deepEqual(partialInputResult.produced, {});
    assert.equal(state.getResource('iron'), 0.5);

    state.data.resources.iron = 3;
    storage.set('lastActive', String(Date.now() - 10 * 60 * 1000));
    const suppliedResult = offline.applyOfflineProduction(gameManager);
    assert.equal(suppliedResult.produced.steel, 6);
    assert.equal(state.getResource('iron'), 0);
  }));

test('offline rate boosts accelerate both chain output and input use', () =>
  withBrowserEnvironment(({ storage }) => {
    const state = new GameState();
    state.data.workers = { smelter: 1 };
    state.data.resources = { population: 1, iron: 1_000 };
    storage.set('lastActive', String(Date.now() - 10 * 60 * 1000));

    const offline = new OfflineManager(state);
    const gameManager = {
      systems: {
        prestigeManager: {
          getOfflineConfig: () => ({ fullHours: 8, reducedHours: 24, reducedRate: 0.5, rateMult: 2 }),
          getMultiplier: () => 1,
          getMasteryMultiplier: () => 1,
          getChainBonusMultiplier: () => 1,
          getGrainMultiplier: () => 1,
          getPopulationGrowthMultiplier: () => 1,
        },
        workerManager: {
          getEffectiveInterval: () => 1000,
          getDiminishingReturnsFactor: () => 1,
          getSoftCapMultiplier: () => 1,
        },
      },
      getCurrentEraData: () => ({
        workers: [{ id: 'smelter', interval: 1000, consumes: { iron: 1 }, produces: { steel: 1 } }],
      }),
      getPopulationCapacity: () => 50,
      getPopulationFoodFactor: () => 1,
      getPopulationWorkerLoadFactor: () => 1,
      getSpecializationMultiplier: () => 1,
      getWorkerSpecializationMultiplier: () => 1,
    };

    const result = offline.applyOfflineProduction(gameManager);
    assert.equal(result.produced.steel, 1_000);
    assert.equal(state.getResource('iron'), 0);
  }));

test('offline production applies the reduced rate after crossing a soft cap', () =>
  withBrowserEnvironment(({ storage }) => {
    const state = new GameState();
    state.data.workers = { gatherer: 1 };
    state.data.resources = { population: 1 };
    storage.set('lastActive', String(Date.now() - 60 * 1000));

    const offline = new OfflineManager(state);
    const gameManager = {
      systems: {
        workerManager: {
          getEffectiveInterval: () => 1000,
          getDiminishingReturnsFactor: () => 1,
          getEffectiveSoftCap: () => 10,
        },
      },
      getCurrentEraData: () => ({
        workers: [{ id: 'gatherer', interval: 1000, produces: { sticks: 1 } }],
      }),
      getPopulationCapacity: () => 50,
      getPopulationFoodFactor: () => 1,
      getPopulationWorkerLoadFactor: () => 1,
      getSpecializationMultiplier: () => 1,
      getWorkerSpecializationMultiplier: () => 1,
    };

    const result = offline.applyOfflineProduction(gameManager);
    // 10 at full rate, then roughly 50 at the configured 25% rate.
    assert.equal(result.produced.sticks, 22);
  }));

test('offline timestamps are sanitized and unload listeners are cleaned up', () =>
  withBrowserEnvironment(({ storage, listeners }) => {
    const offline = new OfflineManager(new GameState());
    assert.equal(listeners.get('beforeunload')?.size, 1);

    const beforeInvalidTimestamp = Date.now();
    storage.set('lastActive', 'not-a-date');
    assert.equal(offline.applyOfflineProduction({}), null);
    const sanitizedInvalidTimestamp = Number(storage.get('lastActive'));
    assert.equal(Number.isFinite(sanitizedInvalidTimestamp), true);
    assert.ok(sanitizedInvalidTimestamp >= beforeInvalidTimestamp);
    assert.ok(sanitizedInvalidTimestamp <= Date.now());

    const beforeFutureTimestamp = Date.now();
    storage.set('lastActive', String(Date.now() + 60_000));
    assert.equal(offline.applyOfflineProduction({}), null);
    const sanitizedFutureTimestamp = Number(storage.get('lastActive'));
    assert.equal(Number.isFinite(sanitizedFutureTimestamp), true);
    assert.ok(sanitizedFutureTimestamp >= beforeFutureTimestamp);
    assert.ok(sanitizedFutureTimestamp <= Date.now());

    offline.destroy();
    assert.equal(listeners.get('beforeunload')?.size, 0);
  }));
