import { writable } from 'svelte/store';

import { config } from '../../../js/core/config.js';
import { scaleCost } from '../../../js/core/resourceUtils.js';

const GAME_STATE_EVENTS = [
  'resourceChange',
  'workerChange',
  'upgradeUnlocked',
  'progressionChange',
  'achievementUnlocked',
  'achievementChange',
  'eraAdvancement',
  'eraSpecializationChosen',
  'civSpecializationChosen',
  'tradeRouteEstablished',
  'wonderBuilt',
  'prestigeChange',
  'actionCooldownChange',
  'gameLoaded',
  'gameReset',
];

function createInitialState() {
  return {
    initialized: false,
    currentEra: 'paleolithic',
    currentEraData: null,
    canAdvance: false,
    eraNumber: 1,
    eraCount: config.eraOrder.length,
    nextEra: null,
    eraTimeline: [],
    timelineMinWidth: '320px',
    advancementRequirements: [],
    resources: {},
    lifetimeProduced: {},
    resourceSoftCapMultipliers: {},
    workers: {},
    availablePopulation: 0,
    workerViews: [],
    upgrades: {},
    upgradeViews: [],
    actions: [],
    progression: {
      eraProgress: 0,
      totalClicks: 0,
      totalResources: 0,
      totalWorkers: 0,
      totalUpgrades: 0,
      achievements: [],
    },
    achievements: [],
    prestige: null,
    prestigeView: {
      canPrestige: false,
      epGain: 0,
      multiplier: 1,
      talentTree: [],
    },
    eraSpecializations: {},
    currentEraSpecialization: null,
    eraSpecializationChoices: [],
    civSpecializations: {},
    currentCivSpecialization: null,
    civSpecializationChoices: [],
    nextCivSpecialization: null,
    tradeRoutes: { activeRoutes: [] },
    availableRoutes: [],
    nextTradeRoute: null,
    wonders: { built: [] },
    availableWonders: [],
    hasCivSpecialization: false,
    isBronzeOrLater: false,
    notifications: [],
    eventLog: [],
    disasterLog: [],
  };
}

function copyPrestige(prestige) {
  if (!prestige) return null;
  return {
    ...prestige,
    purchasedPerks: [...(prestige.purchasedPerks || [])],
    completedEras: [...(prestige.completedEras || [])],
  };
}

function getEraTimeline(currentEra, highestEra) {
  const currentIndex = config.eraOrder.indexOf(currentEra);
  const savedHighestIndex = config.eraOrder.indexOf(highestEra);
  const highestIndex = Math.max(currentIndex, savedHighestIndex >= 0 ? savedHighestIndex : 0);
  const revealThrough = Math.min(
    config.eraOrder.length - 1,
    Math.max(currentIndex, highestIndex) + 1,
  );

  return config.eraOrder.slice(0, revealThrough + 1).map((key, index) => {
    const era = config.eras?.[key] || config.eraData?.[key] || {};
    const unlocked = index <= highestIndex;
    const name = era.name || key;
    return {
      key,
      index,
      unlocked,
      current: index === currentIndex,
      best: index === highestIndex && highestIndex !== currentIndex,
      name: unlocked ? name : '?',
      shortName: unlocked
        ? name.replace('Age of ', '').replace(' Era', '').replace('Age', '').trim()
        : '?',
      timespan: unlocked ? era.timespan || '' : '',
    };
  });
}

function getNextCivSpecialization(currentEra) {
  const currentIndex = config.eraOrder.indexOf(currentEra);
  const key = config.eraOrder.find((eraKey) => {
    const eraIndex = config.eraOrder.indexOf(eraKey);
    return eraIndex > currentIndex && (config.civSpecializations?.[eraKey] || []).length > 0;
  });

  if (!key) return null;
  return { key, name: config.eras?.[key]?.name || key };
}

function getNextTradeRoute(currentEra) {
  const currentIndex = config.eraOrder.indexOf(currentEra);
  const routes = Object.values(config.tradeRoutes || [])
    .filter((route) => config.eraOrder.indexOf(route.unlockEra) > currentIndex)
    .sort((left, right) => (
      config.eraOrder.indexOf(left.unlockEra) - config.eraOrder.indexOf(right.unlockEra)
    ));
  const route = routes[0];
  if (!route) return null;
  return {
    era: route.unlockEra,
    eraName: config.eras?.[route.unlockEra]?.name || route.unlockEra,
  };
}

function getSnapshot(gameManager) {
  const gameState = gameManager.gameState;
  const data = gameState.data;
  const currentEra = data.currentEra;
  const currentEraData = gameManager.getCurrentEraData();
  const workerManager = gameManager.systems.workerManager;
  const prestigeManager = gameManager.systems.prestigeManager;
  const resources = { ...data.resources };
  const prestige = copyPrestige(prestigeManager?.getPrestigeData());
  const upgradeCostMultiplier = (prestigeManager?.getUpgradeCostMultiplier?.() || 1)
    * (config.balance?.upgradeCostMultiplier || 1);

  const workerViews = (currentEraData?.workers || []).map((worker) => {
    const info = workerManager?.getWorkerInfo?.(worker.id);
    const cost = info?.cost || worker.cost;
    const canAfford = gameState.canAfford(cost);
    const requirementMet = info?.requirementMet ?? !worker.requiresUpgrade;
    const hasAvailablePopulation = info?.hasAvailablePopulation ?? false;
    return {
      ...worker,
      ...info,
      cost,
      canAfford,
      requirementMet,
      hasAvailablePopulation,
      canHire: canAfford && requirementMet && hasAvailablePopulation,
    };
  });

  const upgradeViews = (currentEraData?.upgrades || []).map((upgrade) => {
    const adjustedCost = scaleCost(upgrade.cost, upgradeCostMultiplier);
    const isUnlocked = data.upgrades[upgrade.id] === true;
    const hasRequiredUpgrade = !upgrade.requiresUpgrade || data.upgrades[upgrade.requiresUpgrade] === true;
    const canAfford = gameState.canAfford(adjustedCost);
    return {
      ...upgrade,
      adjustedCost,
      isUnlocked,
      hasRequiredUpgrade,
      canAfford,
      canBuy: !isUnlocked && hasRequiredUpgrade && canAfford,
      hasPrestigeDiscount: (prestigeManager?.getUpgradeCostMultiplier?.() || 1) < 1,
    };
  });

  const advancementRequirements = Object.entries(currentEraData?.advancementCost || {}).map(
    ([resource, required]) => {
      const current = Math.floor(resources[resource] || 0);
      return { resource, current, required, complete: current >= required };
    },
  );
  const currentEraIndex = config.eraOrder.indexOf(currentEra);
  const nextEraKey = config.eraOrder[currentEraIndex + 1];
  const eraTimeline = getEraTimeline(currentEra, prestige?.highestEra || currentEra);

  return {
    currentEra,
    currentEraData,
    canAdvance: gameState.canAdvanceEra(),
    eraNumber: currentEraIndex + 1,
    eraCount: config.eraOrder.length,
    nextEra: nextEraKey
      ? config.eras?.[nextEraKey] || config.eraData?.[nextEraKey] || { name: nextEraKey }
      : null,
    eraTimeline,
    timelineMinWidth: `${Math.max(320, eraTimeline.length * 88)}px`,
    advancementRequirements,
    resources,
    lifetimeProduced: { ...data.lifetimeProduced },
    resourceSoftCapMultipliers: Object.fromEntries(
      Object.keys(resources).map((resource) => [
        resource,
        workerManager?.getSoftCapMultiplier?.(resource) ?? 1,
      ]),
    ),
    workers: { ...data.workers },
    availablePopulation: gameState.getAvailablePopulation(),
    workerViews,
    upgrades: { ...data.upgrades },
    upgradeViews,
    actions: gameManager.getCurrentActionViews(),
    progression: { ...data.progression },
    achievements: gameManager.systems.achievementManager?.getAllAchievements() || [],
    prestige,
    prestigeView: {
      canPrestige: prestigeManager?.canPrestige() ?? false,
      epGain: prestigeManager?.calculateEPGain() ?? 0,
      multiplier: prestigeManager?.getMultiplier() ?? 1,
      talentTree: prestigeManager?.getTalentTree() || [],
    },
    eraSpecializations: { ...data.eraSpecializations },
    currentEraSpecialization: data.eraSpecializations?.[currentEra] || null,
    eraSpecializationChoices: config.eraSpecializations?.[currentEra] || [],
    civSpecializations: { ...data.civSpecializations },
    currentCivSpecialization: data.civSpecializations?.[currentEra] || null,
    civSpecializationChoices: config.civSpecializations?.[currentEra] || [],
    nextCivSpecialization: getNextCivSpecialization(currentEra),
    tradeRoutes: { ...data.tradeRoutes, activeRoutes: [...(data.tradeRoutes?.activeRoutes || [])] },
    availableRoutes: gameManager.getAvailableTradeRoutes(),
    nextTradeRoute: getNextTradeRoute(currentEra),
    wonders: { ...data.wonders, built: [...(data.wonders?.built || [])] },
    availableWonders: gameManager.getAvailableWonders(),
    hasCivSpecialization: Object.keys(data.civSpecializations || {}).length > 0,
    isBronzeOrLater: currentEraIndex >= config.eraOrder.indexOf('bronze'),
  };
}

/**
 * Presentation adapter for the game. Components consume immutable-ish display
 * snapshots and issue commands here; domain managers remain an implementation
 * detail behind this boundary.
 */
export function createGameStore() {
  const { subscribe, set, update } = writable(createInitialState());
  let gameManager = null;
  let gameState = null;
  let notificationId = 0;
  const stateListeners = [];
  const notificationTimers = new Set();

  const synchronize = () => {
    if (!gameManager?.gameState) return;
    update((state) => ({
      ...state,
      initialized: true,
      ...getSnapshot(gameManager),
    }));
  };

  const removeStateListeners = () => {
    stateListeners.forEach(({ event, listener }) => gameState?.removeListener(event, listener));
    stateListeners.length = 0;
  };

  const clearNotificationTimers = () => {
    notificationTimers.forEach((timer) => clearTimeout(timer));
    notificationTimers.clear();
  };

  const api = {
    subscribe,

    initialize(nextGameManager) {
      api.dispose();
      gameManager = nextGameManager;
      gameState = nextGameManager.gameState;

      nextGameManager.setStore({
        showNotification: api.showNotification,
        logEvent: api.logEvent,
        logDisaster: api.logDisaster,
      });

      GAME_STATE_EVENTS.forEach((event) => {
        const listener = synchronize;
        gameState.addListener(event, listener);
        stateListeners.push({ event, listener });
      });
      synchronize();

      const eraInfo = nextGameManager.getCurrentEraData?.();
      api.logEvent({
        name: `${eraInfo?.name || 'Paleolithic Era'} begun`,
        description: eraInfo?.description || 'A new run has begun.',
      });
    },

    dispose(expectedGameManager = gameManager) {
      if (expectedGameManager && gameManager && expectedGameManager !== gameManager) return;

      removeStateListeners();
      clearNotificationTimers();
      if (gameManager?.store) gameManager.setStore(null);
      gameManager = null;
      gameState = null;
      set(createInitialState());
    },

    showNotification(message, type = 'success', duration = 2000) {
      const id = ++notificationId;
      update((state) => ({
        ...state,
        notifications: [...state.notifications, { id, message, type }],
      }));

      const timer = setTimeout(() => {
        notificationTimers.delete(timer);
        update((state) => ({
          ...state,
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }));
      }, duration);
      notificationTimers.add(timer);
    },

    logEvent(event) {
      update((state) => ({
        ...state,
        eventLog: [{ ...event, timestamp: Date.now() }, ...state.eventLog].slice(0, 50),
      }));
    },

    logDisaster(disaster) {
      update((state) => ({
        ...state,
        disasterLog: [{ ...disaster, timestamp: Date.now() }, ...state.disasterLog].slice(0, 50),
      }));
    },

    advanceEra() {
      const result = gameManager?.advanceEra() || false;
      synchronize();
      return result;
    },

    saveGame() {
      return gameManager?.saveGame() || false;
    },

    exportSave() {
      gameManager?.exportSave();
    },

    importSave(encoded) {
      gameManager?.importSave(encoded);
      synchronize();
    },

    resetGame() {
      const result = gameManager?.resetGame() || false;
      synchronize();
      return result;
    },

    performAction(actionId) {
      const action = gameManager?.getCurrentEraData()?.actions?.find(({ id }) => id === actionId);
      const result = action ? gameManager.doClickAction(action) : null;
      synchronize();
      return result;
    },

    hireWorker(workerId) {
      const result = gameManager?.hireWorker(workerId);
      synchronize();
      return result;
    },

    buyUpgrade(upgradeId) {
      const result = gameManager?.buyUpgrade(upgradeId) || false;
      synchronize();
      return result;
    },

    performPrestige() {
      const result = gameManager?.performPrestige();
      synchronize();
      return result;
    },

    buyPerk(perkId) {
      const result = gameManager?.purchasePrestigePerk(perkId) || false;
      synchronize();
      return result;
    },

    chooseSpecialization(specId) {
      const result = gameManager?.chooseSpecialization(gameState?.data.currentEra, specId) || false;
      synchronize();
      return result;
    },

    chooseCivSpecialization(civId) {
      const result = gameManager?.chooseCivSpecialization(gameState?.data.currentEra, civId) || false;
      synchronize();
      return result;
    },

    establishTradeRoute(routeId) {
      const result = gameManager?.establishTradeRoute(routeId) || false;
      synchronize();
      return result;
    },

    buildWonder(wonderId) {
      const result = gameManager?.buildWonder(wonderId) || false;
      synchronize();
      return result;
    },
  };

  return api;
}

export const gameStore = createGameStore();
