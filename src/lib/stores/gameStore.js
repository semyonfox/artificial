import { writable } from "svelte/store";

import { config } from "../../../js/core/config.js";
import { scaleCost } from "../../../js/core/resourceUtils.js";
import { formatResourceName } from "../utils/gameFormatting.js";
import {
  getPopulationSupportResources,
  getWorkerFoodResource,
} from "../utils/populationSupport.js";

const GAME_STATE_EVENTS = [
  "resourceChange",
  "workerChange",
  "upgradeUnlocked",
  "progressionChange",
  "achievementUnlocked",
  "achievementChange",
  "eraAdvancement",
  "eraSpecializationChosen",
  "civSpecializationChosen",
  "tradeRouteEstablished",
  "wonderBuilt",
  "prestigeChange",
  "actionCooldownChange",
  "gameLoaded",
  "gameReset",
  "importBackupChange",
];

function createInitialState() {
  return {
    initialized: false,
    currentEra: "paleolithic",
    currentEraData: null,
    canAdvance: false,
    eraNumber: 1,
    eraCount: config.eraOrder.length,
    nextEra: null,
    eraTimeline: [],
    timelineMinWidth: "320px",
    advancementRequirements: [],
    resources: {},
    lifetimeProduced: {},
    resourceSoftCapMultipliers: {},
    workers: {},
    availablePopulation: 0,
    workerViews: [],
    resourceFlows: {},
    populationView: {
      pop: 0,
      cap: 0,
      totalWorkers: 0,
      loadRatio: 0,
      supportAvailable: 0,
      supportResources: [],
      foodResource: "cookedMeat",
    },
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
    hasImportBackup: false,
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
  const highestIndex = Math.max(
    currentIndex,
    savedHighestIndex >= 0 ? savedHighestIndex : 0,
  );
  const revealThrough = Math.min(
    config.eraOrder.length - 1,
    Math.max(currentIndex, highestIndex) + 1,
  );

  return config.eraOrder.slice(0, revealThrough + 1).map((key, index) => {
    const era = config.eraData?.[key] || {};
    const unlocked = index <= highestIndex;
    const name = era.name || key;
    return {
      key,
      index,
      unlocked,
      current: index === currentIndex,
      best: index === highestIndex && highestIndex !== currentIndex,
      name: unlocked ? name : "?",
      shortName: unlocked
        ? name
            .replace("Age of ", "")
            .replace(" Era", "")
            .replace("Age", "")
            .trim()
        : "?",
      timespan: unlocked ? era.timespan || "" : "",
    };
  });
}

function getNextCivSpecialization(currentEra) {
  const currentIndex = config.eraOrder.indexOf(currentEra);
  const key = config.eraOrder.find((eraKey) => {
    const eraIndex = config.eraOrder.indexOf(eraKey);
    return (
      eraIndex > currentIndex &&
      (config.civSpecializations?.[eraKey] || []).length > 0
    );
  });

  if (!key) return null;
  return { key, name: config.eraData?.[key]?.name || key };
}

function getNextTradeRoute(currentEra) {
  const currentIndex = config.eraOrder.indexOf(currentEra);
  const routes = Object.values(config.tradeRoutes || [])
    .filter((route) => config.eraOrder.indexOf(route.unlockEra) > currentIndex)
    .sort(
      (left, right) =>
        config.eraOrder.indexOf(left.unlockEra) -
        config.eraOrder.indexOf(right.unlockEra),
    );
  const route = routes[0];
  if (!route) return null;
  return {
    era: route.unlockEra,
    eraName: config.eraData?.[route.unlockEra]?.name || route.unlockEra,
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
  const upgradeCostMultiplier =
    (prestigeManager?.getUpgradeCostMultiplier?.() || 1) *
    (config.balance?.upgradeCostMultiplier || 1);

  const workerViews = (currentEraData?.workers || []).map((worker) => {
    const info = workerManager?.getWorkerInfo?.(worker.id) || {};
    const cost = info.cost || worker.cost;
    const canAfford = gameState.canAfford(cost);
    const requirementMet = info.requirementMet ?? !worker.requiresUpgrade;
    const hasAvailablePopulation = info.hasAvailablePopulation ?? false;
    const count = info.count ?? data.workers[worker.id] ?? 0;

    // a worker with unmet inputs idles completely (workersAbleToWork hits 0),
    // so surface which input ran dry
    let inputStarved = false;
    let starvedInput = null;
    if (count > 0 && worker.consumes) {
      for (const [resource, perWorker] of Object.entries(worker.consumes)) {
        if (Math.floor((resources[resource] || 0) / perWorker) <= 0) {
          inputStarved = true;
          starvedInput = starvedInput || resource;
        }
      }
    }

    return {
      ...worker,
      ...info,
      cost,
      canAfford,
      requirementMet,
      hasAvailablePopulation,
      canHire: canAfford && requirementMet && hasAvailablePopulation,
      inputStarved,
      starvedInput,
    };
  });

  // estimated per-second flows for display only; mirrors WorkerManager math
  // loosely (prestige multiplier, diminishing returns, soft caps) and is
  // labeled an estimate in the UI
  const prestigeViewData = {
    canPrestige: prestigeManager?.canPrestige() ?? false,
    epGain: prestigeManager?.calculateEPGain() ?? 0,
    multiplier: prestigeManager?.getMultiplier() ?? 1,
    talentTree: prestigeManager?.getTalentTree() || [],
  };

  const foodResource = getWorkerFoodResource(currentEra);
  const foodCycleInterval = config.gameVariables?.workerFoodCycleInterval || 3;
  const resourceFlows = {};
  const addFlow = (resource, kind, amount) => {
    if (!amount) return;
    const flow = resourceFlows[resource] || {
      producePerSec: 0,
      consumePerSec: 0,
    };
    flow[kind] += amount;
    resourceFlows[resource] = flow;
  };

  for (const view of workerViews) {
    const count = view.count || 0;
    if (count <= 0) continue;

    // starved workers do no work: no production and no input consumption
    const intervalSec = Math.max(500, view.interval || 10000) / 1000;
    const efficiency = (view.efficiencyPct ?? 100) / 100;
    const cycleRate = view.inputStarved ? 0 : count / intervalSec;

    for (const [resource, perWorker] of Object.entries(view.produces || {})) {
      const capMult = workerManager?.getSoftCapMultiplier?.(resource) ?? 1;
      addFlow(
        resource,
        "producePerSec",
        perWorker *
          cycleRate *
          efficiency *
          prestigeViewData.multiplier *
          capMult,
      );
    }
    for (const [resource, perWorker] of Object.entries(view.consumes || {})) {
      addFlow(resource, "consumePerSec", perWorker * cycleRate);
    }
    // workers eat every N work cycles
    addFlow(
      foodResource,
      "consumePerSec",
      count / (intervalSec * foodCycleInterval),
    );
  }

  const supportResources = getPopulationSupportResources(currentEra);
  const pop = resources.population || 0;
  const totalWorkers = gameState.getTotalWorkers?.() || 0;
  const populationView = {
    pop,
    cap: gameState.getPopulationCapacity?.() || pop,
    totalWorkers,
    loadRatio: totalWorkers / Math.max(1, pop),
    supportAvailable: supportResources.reduce(
      (sum, key) => sum + (resources[key] || 0),
      0,
    ),
    supportResources,
    foodResource,
  };

  const upgradeViews = (currentEraData?.upgrades || []).map((upgrade) => {
    const adjustedCost = scaleCost(upgrade.cost, upgradeCostMultiplier);
    const isUnlocked = data.upgrades[upgrade.id] === true;
    const hasRequiredUpgrade =
      !upgrade.requiresUpgrade ||
      data.upgrades[upgrade.requiresUpgrade] === true;
    const canAfford = gameState.canAfford(adjustedCost);
    return {
      ...upgrade,
      adjustedCost,
      isUnlocked,
      hasRequiredUpgrade,
      canAfford,
      canBuy: !isUnlocked && hasRequiredUpgrade && canAfford,
      hasPrestigeDiscount:
        (prestigeManager?.getUpgradeCostMultiplier?.() || 1) < 1,
    };
  });

  const advancementRequirements = Object.entries(
    currentEraData?.advancementCost || {},
  ).map(([resource, required]) => {
    const current = Math.floor(resources[resource] || 0);
    return { resource, current, required, complete: current >= required };
  });
  const currentEraIndex = config.eraOrder.indexOf(currentEra);
  const nextEraKey = config.eraOrder[currentEraIndex + 1];
  const eraTimeline = getEraTimeline(
    currentEra,
    prestige?.highestEra || currentEra,
  );

  return {
    currentEra,
    currentEraData,
    canAdvance: gameState.canAdvanceEra(),
    eraNumber: currentEraIndex + 1,
    eraCount: config.eraOrder.length,
    nextEra: nextEraKey
      ? config.eraData?.[nextEraKey] || { name: nextEraKey }
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
    resourceFlows,
    populationView,
    upgrades: { ...data.upgrades },
    upgradeViews,
    actions: gameManager.getCurrentActionViews(),
    progression: { ...data.progression },
    achievements:
      gameManager.systems.achievementManager?.getAllAchievements() || [],
    prestige,
    prestigeView: prestigeViewData,
    eraSpecializations: { ...data.eraSpecializations },
    currentEraSpecialization: data.eraSpecializations?.[currentEra] || null,
    eraSpecializationChoices: config.eraSpecializations?.[currentEra] || [],
    civSpecializations: { ...data.civSpecializations },
    currentCivSpecialization: data.civSpecializations?.[currentEra] || null,
    civSpecializationChoices: config.civSpecializations?.[currentEra] || [],
    nextCivSpecialization: getNextCivSpecialization(currentEra),
    tradeRoutes: {
      ...data.tradeRoutes,
      activeRoutes: [...(data.tradeRoutes?.activeRoutes || [])],
    },
    availableRoutes: gameManager.getAvailableTradeRoutes(),
    nextTradeRoute: getNextTradeRoute(currentEra),
    wonders: { ...data.wonders, built: [...(data.wonders?.built || [])] },
    availableWonders: gameManager.getAvailableWonders(),
    hasCivSpecialization: Object.keys(data.civSpecializations || {}).length > 0,
    isBronzeOrLater: currentEraIndex >= config.eraOrder.indexOf("bronze"),
    hasImportBackup: gameManager.hasImportBackup?.() ?? false,
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
  let syncQueued = false;
  let syncVersion = 0;
  const stateListeners = [];
  const notificationTimers = new Set();
  let idleWorkerFlags = new Map();

  // dedupe bookkeeping for toasts
  const DEDUPE_WINDOW_MS = 1200;
  let stateNotifications = [];
  const recentNotificationKeys = new Map();
  subscribe((state) => {
    stateNotifications = state.notifications || [];
  });

  // one-shot awareness alerts: fire only on the tick a worker transitions
  // into an input-starved (fully idle) state, never per tick while it stays there
  const detectIdleTransitions = (snapshot) => {
    const alerts = [];
    const nextFlags = new Map();
    for (const view of snapshot.workerViews || []) {
      if (!view.count) continue;
      nextFlags.set(view.id, Boolean(view.inputStarved));
      if (view.inputStarved && !idleWorkerFlags.get(view.id)) {
        alerts.push(
          `${view.name} stopped: no ${formatResourceName(view.starvedInput)}`,
        );
      }
    }
    idleWorkerFlags = nextFlags;
    return alerts;
  };

  const synchronize = () => {
    if (!gameManager?.gameState) return;
    // An explicit command has already produced a current snapshot, so any
    // pending passive update is redundant.
    syncVersion += 1;
    syncQueued = false;
    const snapshot = getSnapshot(gameManager);
    const idleAlerts = detectIdleTransitions(snapshot);
    update((state) => ({
      ...state,
      initialized: true,
      ...snapshot,
    }));
    idleAlerts.forEach((message) =>
      api.showNotification(message, "warning", 3000),
    );
  };

  // A single game operation can emit several domain events. Coalesce passive
  // updates while command handlers still synchronize before they return.
  const scheduleSynchronize = () => {
    if (syncQueued) return;
    syncQueued = true;
    const scheduledVersion = syncVersion;
    queueMicrotask(() => {
      if (scheduledVersion !== syncVersion) return;
      syncQueued = false;
      synchronize();
    });
  };

  const removeStateListeners = () => {
    stateListeners.forEach(({ event, listener }) =>
      gameState?.removeListener(event, listener),
    );
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
        const listener = scheduleSynchronize;
        gameState.addListener(event, listener);
        stateListeners.push({ event, listener });
      });
      synchronize();

      const eraInfo = nextGameManager.getCurrentEraData?.();
      api.logEvent({
        name: `${eraInfo?.name || "Paleolithic Era"} begun`,
        description: eraInfo?.description || "A new run has begun.",
      });
    },

    dispose(expectedGameManager = gameManager) {
      if (
        expectedGameManager &&
        gameManager &&
        expectedGameManager !== gameManager
      )
        return;

      removeStateListeners();
      clearNotificationTimers();
      syncVersion += 1;
      syncQueued = false;
      idleWorkerFlags = new Map();
      if (gameManager?.store) gameManager.setStore(null);
      gameManager = null;
      gameState = null;
      set(createInitialState());
    },

    showNotification(message, type = "success", duration = 2000) {
      const now = Date.now();
      const key = `${type}:${message}`;

      // spam guard: never stack a message that is already visible or was
      // shown within the dedupe window
      const displayed = stateNotifications.some(
        (notification) =>
          notification.type === type && notification.message === message,
      );
      if (
        displayed ||
        now - (recentNotificationKeys.get(key) || -Infinity) < DEDUPE_WINDOW_MS
      ) {
        return;
      }
      recentNotificationKeys.set(key, now);
      for (const [seenKey, seenAt] of recentNotificationKeys) {
        if (now - seenAt > 10 * DEDUPE_WINDOW_MS) {
          recentNotificationKeys.delete(seenKey);
        }
      }

      const id = ++notificationId;
      update((state) => ({
        ...state,
        // newest toast renders topmost
        notifications: [{ id, message, type }, ...state.notifications],
      }));

      const timer = setTimeout(() => {
        notificationTimers.delete(timer);
        update((state) => ({
          ...state,
          notifications: state.notifications.filter(
            (notification) => notification.id !== id,
          ),
        }));
      }, duration);
      notificationTimers.add(timer);
    },

    dismissNotification(id) {
      update((state) => ({
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== id,
        ),
      }));
    },

    logEvent(event) {
      update((state) => ({
        ...state,
        eventLog: [
          { ...event, timestamp: Date.now() },
          ...state.eventLog,
        ].slice(0, 50),
      }));
    },

    logDisaster(disaster) {
      update((state) => ({
        ...state,
        disasterLog: [
          { ...disaster, timestamp: Date.now() },
          ...state.disasterLog,
        ].slice(0, 50),
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

    restoreImportBackup() {
      const result = gameManager?.restoreImportBackup() || false;
      synchronize();
      return result;
    },

    performAction(actionId) {
      const action = gameManager
        ?.getCurrentEraData()
        ?.actions?.find(({ id }) => id === actionId);
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
      const result =
        gameManager?.chooseSpecialization(gameState?.data.currentEra, specId) ||
        false;
      synchronize();
      return result;
    },

    chooseCivSpecialization(civId) {
      const result =
        gameManager?.chooseCivSpecialization(
          gameState?.data.currentEra,
          civId,
        ) || false;
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
