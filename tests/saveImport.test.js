import test from 'node:test';
import assert from 'node:assert/strict';

import { GameManager } from '../js/GameManager.js';
import { GameState } from '../js/core/GameState.js';
import { config } from '../js/core/config.js';

function encodeSave(save) {
  return Buffer.from(JSON.stringify(save), 'utf8').toString('base64');
}

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

function makeImportHarness() {
  const notifications = [];
  const storage = makeStorage();
  globalThis.localStorage = storage;
  globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');

  const manager = Object.create(GameManager.prototype);
  manager.gameState = new GameState();
  manager.loadGameCalls = 0;
  manager.loadGame = () => {
    manager.loadGameCalls += 1;
  };
  manager.showNotification = (message, type) => {
    notifications.push({ message, type });
  };

  return { manager, notifications, storage };
}

test('importSave persists only a sanitized current save object', () => {
  const { manager, notifications, storage } = makeImportHarness();
  const save = {
    schemaVersion: 2,
    currentEra: 'paleolithic',
    resources: { sticks: 25, population: 4, impossible: 1e99 },
    workers: { gatherer: 2 },
    progression: { totalClicks: 10 },
    settings: { autoSave: false, fastMode: true },
    unexpectedTopLevel: { shouldNotPersist: true }
  };

  manager.importSave(encodeSave(save));

  const persisted = JSON.parse(storage.getItem(config.storage.saveKey));
  assert.equal(manager.loadGameCalls, 1);
  assert.equal(notifications.at(-1).type, 'success');
  assert.equal(persisted.resources.sticks, 25);
  assert.equal(persisted.resources.impossible, 1_000_000_000_000);
  assert.equal(persisted.workers.gatherer, 2);
  assert.equal(persisted.progression.totalClicks, 10);
  assert.equal(persisted.settings.autoSave, false);
  assert.equal(persisted.settings.fastMode, true);
  assert.equal(Object.hasOwn(persisted, 'unexpectedTopLevel'), false);
});

test('importSave migrates old save fields before persistence', () => {
  const { manager, storage } = makeImportHarness();
  const legacySave = {
    schemaVersion: 1,
    currentEra: 'stone_age',
    resources: { population: 3, rawMeat: 5, hide: 2 },
    workers: { forager: 1 },
    unlockedUpgrades: ['fireControl']
  };

  manager.importSave(encodeSave(legacySave));

  const persisted = JSON.parse(storage.getItem(config.storage.saveKey));
  assert.equal(persisted.currentEra, 'paleolithic');
  assert.equal(persisted.resources.meat, 5);
  assert.equal(persisted.resources.fur, 2);
  assert.equal(persisted.workers.gatherer, 1);
  assert.equal(persisted.upgrades.fireControl, true);
  assert.equal(Object.hasOwn(persisted.workers, 'forager'), false);
});

test('importSave rejects oversized, corrupt, non-object, and future-version saves', () => {
  const cases = [
    Buffer.from('x'.repeat(385 * 1024), 'utf8').toString('base64'),
    'not-valid-base64',
    Buffer.from(JSON.stringify([]), 'utf8').toString('base64'),
    encodeSave({ schemaVersion: 999 })
  ];

  for (const encoded of cases) {
    const { manager, notifications, storage } = makeImportHarness();
    manager.importSave(encoded);

    assert.equal(storage.getItem(config.storage.saveKey), null);
    assert.equal(manager.loadGameCalls, 0);
    assert.equal(notifications.at(-1).message, 'Invalid save data');
    assert.equal(notifications.at(-1).type, 'error');
  }
});

test('importSave clamps hostile numeric state before writing localStorage', () => {
  const { manager, storage } = makeImportHarness();
  const hostileSave = {
    schemaVersion: 2,
    currentEra: 'paleolithic',
    gameStartTime: 1e99,
    totalPlayTime: 1e99,
    resources: { sticks: -10, stones: Number.MAX_VALUE, population: 1e99 },
    workers: { gatherer: 2.9 },
    lifetimeProduced: { stones: Number.MAX_VALUE, meat: -5 },
    progression: {
      eraProgress: 1e99,
      totalClicks: -1,
      totalResources: Number.MAX_VALUE,
      totalWorkers: 4,
      totalUpgrades: 3,
      achievements: 'bad'
    },
    prestige: {
      evolutionPoints: Number.MAX_VALUE,
      lifetimeEP: -3,
      totalResets: 2,
      highestEra: 'bad-era',
      purchasedPerks: 'bad',
      completedEras: 'bad'
    }
  };

  manager.importSave(encodeSave(hostileSave));

  const persisted = JSON.parse(storage.getItem(config.storage.saveKey));
  assert.equal(persisted.resources.stones, 1_000_000_000_000);
  assert.equal(persisted.resources.population, 50);
  assert.equal(Object.hasOwn(persisted.resources, 'sticks'), false);
  assert.equal(persisted.workers.gatherer, 2);
  assert.equal(persisted.lifetimeProduced.stones, 1_000_000_000_000);
  assert.equal(Object.hasOwn(persisted.lifetimeProduced, 'meat'), false);
  assert.equal(persisted.progression.eraProgress, 1_000_000_000_000);
  assert.equal(persisted.progression.totalClicks, 0);
  assert.deepEqual(persisted.progression.achievements, []);
  assert.equal(persisted.prestige.evolutionPoints, 1_000_000_000_000);
  assert.equal(persisted.prestige.lifetimeEP, 0);
  assert.equal(persisted.prestige.highestEra, 'paleolithic');
  assert.deepEqual(persisted.prestige.purchasedPerks, []);
  assert.deepEqual(persisted.prestige.completedEras, []);
});
