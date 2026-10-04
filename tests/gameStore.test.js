import assert from 'node:assert/strict';
import test from 'node:test';

import { get } from 'svelte/store';

import { GameManager } from '../js/GameManager.js';
import { GameState } from '../js/core/GameState.js';
import { config } from '../js/core/config.js';
import { createGameStore } from '../src/lib/stores/gameStore.js';

function createGameManager(route) {
  const gameState = new GameState();
  const prestige = {
    evolutionPoints: 0,
    lifetimeEP: 0,
    totalResets: 0,
    highestEra: 'paleolithic',
    purchasedPerks: [],
    completedEras: [],
  };

  return {
    gameState,
    systems: {
      workerManager: {
        getSoftCapMultiplier: () => 1,
      },
      prestigeManager: {
        getPrestigeData: () => prestige,
        getUpgradeCostMultiplier: () => 1,
        canPrestige: () => false,
        calculateEPGain: () => 0,
        getMultiplier: () => 1,
        getTalentTree: () => [],
      },
      achievementManager: {
        getAllAchievements: () => [],
      },
    },
    setStore(store) {
      this.store = store;
    },
    getCurrentEraData: () => config.eraData.paleolithic,
    getCurrentActionViews: () => [],
    getAvailableTradeRoutes: () => [route.current],
    getAvailableWonders: () => [],
  };
}

async function withGameBrowser(run) {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const storage = new Map();

  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = { getElementById: () => null };
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};

  try {
    return await run(storage);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.localStorage = originalLocalStorage;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  }
}

test('the game store refreshes manager-backed feature views from domain events', async () => {
  const route = {
    current: {
      id: 'silkRoad',
      name: 'Silk Road',
      canUnlock: false,
      reason: 'Requires civilization: han',
    },
  };
  const manager = createGameManager(route);
  const store = createGameStore();

  store.initialize(manager);
  assert.equal(get(store).availableRoutes[0].canUnlock, false);

  route.current = {
    ...route.current,
    canUnlock: true,
    reason: null,
  };
  manager.gameState.notifyListeners('civSpecializationChosen', { civId: 'han' });
  await Promise.resolve();

  assert.equal(get(store).availableRoutes[0].canUnlock, true);
  store.dispose(manager);
});

test('the game store coalesces synchronous passive domain updates', async () => {
  const route = { current: null };
  const manager = createGameManager(route);
  let snapshotCount = 0;
  manager.getCurrentActionViews = () => {
    snapshotCount += 1;
    return [];
  };
  const store = createGameStore();

  store.initialize(manager);
  const initialSnapshotCount = snapshotCount;

  manager.gameState.notifyListeners('resourceChange', {});
  manager.gameState.notifyListeners('workerChange', {});
  assert.equal(snapshotCount, initialSnapshotCount);

  await Promise.resolve();
  assert.equal(snapshotCount, initialSnapshotCount + 1);
  store.dispose(manager);
});

test('the store receives notifications emitted before the Svelte surface attaches', async () => {
  const originalConsoleInfo = console.info;
  console.info = () => {};

  try {
    await withGameBrowser(async (storage) => {
      storage.set('lastActive', String(Date.now() - 2 * 60 * 1000));
      const manager = new GameManager();
      await manager.initPromise;

      const store = createGameStore();
      store.initialize(manager);

      assert.match(get(store).notifications[0]?.message || '', /^Welcome back!/);
      store.dispose(manager);
      manager.destroy();
    });
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('save failure preserves its return value and reports only a fixed category', async () => {
  const { telemetry } = await import('../src/lib/utils/telemetry.js');
  const originalSend = telemetry.send;
  const calls = [];
  telemetry.send = async (...args) => { calls.push(args); return false; };
  const manager = createGameManager({ current: {} });
  manager.saveGame = () => false;
  const store = createGameStore();
  try {
    store.initialize(manager);
    assert.equal(store.saveGame(), false);
    assert.deepEqual(calls, [['error', 'storage_failed', 'game']]);
    manager.saveGame = () => true;
    assert.equal(store.saveGame(), true);
    assert.equal(calls.length, 1);
  } finally { store.dispose(manager); telemetry.send = originalSend; }
});


test('events logged in the same millisecond retain distinct render keys', () => {
  const now = Date.now;
  Date.now = () => 123456;
  const store = createGameStore();
  try {
    store.logEvent({ name: 'Offline production' });
    store.logEvent({ name: 'Era begun' });
    const events = get(store).eventLog;
    assert.equal(events[0].timestamp, events[1].timestamp);
    assert.notEqual(events[0].id, events[1].id);
  } finally { Date.now = now; store.dispose(); }
});
