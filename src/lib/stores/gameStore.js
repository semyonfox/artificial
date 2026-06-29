import { writable, derived } from 'svelte/store';

function getAchievementSnapshot(gameManager) {
  return gameManager?.systems?.achievementManager?.getAllAchievements() || [];
}

function cloneActionProgress(actions = {}) {
  return {
    total: actions.total || 0,
    byId: Object.fromEntries(
      Object.entries(actions.byId || {}).map(([id, action]) => [
        id,
        {
          ...action,
          produced: { ...(action.produced || {}) },
          consumed: { ...(action.consumed || {}) },
          lastResult: action.lastResult
            ? {
                ...action.lastResult,
                produced: { ...(action.lastResult.produced || {}) },
                consumed: { ...(action.lastResult.consumed || {}) },
              }
            : null,
        },
      ]),
    ),
    recent: (actions.recent || []).map((entry) => ({
      ...entry,
      produced: { ...(entry.produced || {}) },
      consumed: { ...(entry.consumed || {}) },
    })),
  };
}

function getStateSnapshot(gameState, gameManager = null) {
  return {
    gameState,
    resources: { ...gameState.data.resources },
    lifetimeProduced: { ...gameState.data.lifetimeProduced },
    workers: { ...gameState.data.workers },
    upgrades: { ...gameState.data.upgrades },
    currentEra: gameState.data.currentEra,
    progression: {
      ...gameState.data.progression,
      actions: cloneActionProgress(gameState.data.progression.actions),
    },
    achievements: getAchievementSnapshot(gameManager),
    prestige: gameState.data.prestige || null,
    eraSpecializations: { ...gameState.data.eraSpecializations },
    civSpecializations: { ...gameState.data.civSpecializations },
    tradeRoutes: { ...gameState.data.tradeRoutes },
    wonders: { ...gameState.data.wonders },
    eventLog: [...(gameState.data.history?.events || [])],
    disasterLog: [...(gameState.data.history?.disasters || [])],
  };
}

function createGameStore() {
  const { subscribe, set, update } = writable({
    initialized: false,
    gameManager: null,
    gameState: null,
    // snapshot of current state for reactivity
    resources: {},
    lifetimeProduced: {},
    workers: {},
    upgrades: {},
    currentEra: 'paleolithic',
    progression: {
      eraProgress: 0,
      totalClicks: 0,
      totalResources: 0,
      totalWorkers: 0,
      totalUpgrades: 0,
      actions: { total: 0, byId: {}, recent: [] },
      achievements: [],
    },
    prestige: null,
    achievements: [],
    eraSpecializations: {},
    civSpecializations: {},
    tradeRoutes: { activeRoutes: [] },
    wonders: { built: [] },
    notifications: [],
    eventLog: [],
    disasterLog: [],
  });

  let notificationId = 0;
  let attachedGameState = null;

  return {
    subscribe,

    initialize(gameManager) {
      const gs = gameManager.gameState;
      attachedGameState = gs;

      // connect gameManager to this store for notifications
      gameManager.setStore({
        showNotification: (msg, type, dur) => this.showNotification(msg, type, dur),
        logEvent: (e) => this.logEvent(e),
        logDisaster: (d) => this.logDisaster(d),
      });

      // initial snapshot
      update(s => ({
        ...s,
        initialized: true,
        gameManager,
        ...getStateSnapshot(gs, gameManager),
      }));

      // listen to GameState events and sync store
      gs.addListener('resourceChange', () => {
        update(s => ({
          ...s,
          resources: { ...gs.data.resources },
          lifetimeProduced: { ...gs.data.lifetimeProduced },
        }));
      });

      gs.addListener('workerChange', () => {
        update(s => ({
          ...s,
          workers: { ...gs.data.workers },
        }));
      });

      gs.addListener('upgradeUnlocked', () => {
        update(s => ({
          ...s,
          upgrades: { ...gs.data.upgrades },
        }));
      });

      gs.addListener('progressionChange', () => {
        update(s => ({
          ...s,
          progression: {
            ...gs.data.progression,
            actions: cloneActionProgress(gs.data.progression.actions),
          },
          achievements: getAchievementSnapshot(gameManager),
        }));
      });

      gs.addListener('achievementUnlocked', () => {
        update(s => ({
          ...s,
          progression: {
            ...gs.data.progression,
            actions: cloneActionProgress(gs.data.progression.actions),
          },
          achievements: getAchievementSnapshot(gameManager),
        }));
      });

      gs.addListener('achievementChange', ({ achievements }) => {
        update(s => ({
          ...s,
          progression: {
            ...gs.data.progression,
            actions: cloneActionProgress(gs.data.progression.actions),
          },
          achievements,
        }));
      });

      gs.addListener('eraAdvancement', () => {
        update(s => ({
          ...s,
          ...getStateSnapshot(gs, gameManager),
        }));
      });

      gs.addListener('eraSpecializationChosen', () => {
        update(s => ({
          ...s,
          eraSpecializations: { ...gs.data.eraSpecializations },
        }));
      });

      gs.addListener('civSpecializationChosen', () => {
        update(s => ({
          ...s,
          civSpecializations: { ...gs.data.civSpecializations },
        }));
      });

      gs.addListener('tradeRouteEstablished', () => {
        update(s => ({
          ...s,
          tradeRoutes: { ...gs.data.tradeRoutes },
        }));
      });

      gs.addListener('wonderBuilt', () => {
        update(s => ({
          ...s,
          wonders: { ...gs.data.wonders },
        }));
      });

      gs.addListener('historyChange', () => {
        update(s => ({
          ...s,
          eventLog: [...(gs.data.history?.events || [])],
          disasterLog: [...(gs.data.history?.disasters || [])],
        }));
      });

      gs.addListener('gameLoaded', () => {
        update(s => ({
          ...s,
          ...getStateSnapshot(gs, gameManager),
        }));
      });

      gs.addListener('gameReset', () => {
        update(s => ({
          ...s,
          ...getStateSnapshot(gs, gameManager),
        }));
      });

      gs.addListener('prestigeChange', () => {
        update(s => ({
          ...s,
          ...getStateSnapshot(gs, gameManager),
        }));
      });
    },

    refresh() {
      update(s => {
        if (!s.gameState) return s;
        const gs = s.gameState;
        return {
          ...s,
          ...getStateSnapshot(gs, s.gameManager),
        };
      });
    },

    updateAchievements(achievements) {
      update(s => ({ ...s, achievements }));
    },

    updatePrestige(prestige) {
      update(s => ({ ...s, prestige }));
    },

    showNotification(message, type = 'success', duration = 2000) {
      const id = ++notificationId;
      update(s => ({
        ...s,
        notifications: [...s.notifications, { id, message, type }],
      }));
      setTimeout(() => {
        update(s => ({
          ...s,
          notifications: s.notifications.filter(n => n.id !== id),
        }));
      }, duration);
    },

    logEvent(event) {
      if (attachedGameState?.appendHistory) {
        attachedGameState.appendHistory('events', event);
        return;
      }
      update(s => ({
        ...s,
        eventLog: [{ ...event, timestamp: Date.now() }, ...s.eventLog].slice(0, 50),
      }));
    },

    logDisaster(disaster) {
      if (attachedGameState?.appendHistory) {
        attachedGameState.appendHistory('disasters', disaster);
        return;
      }
      update(s => ({
        ...s,
        disasterLog: [{ ...disaster, timestamp: Date.now() }, ...s.disasterLog].slice(0, 50),
      }));
    },
  };
}

export const gameStore = createGameStore();

// derived stores for convenience
export const resources = derived(gameStore, $g => $g.resources);
export const workers = derived(gameStore, $g => $g.workers);
export const currentEra = derived(gameStore, $g => $g.currentEra);
export const upgrades = derived(gameStore, $g => $g.upgrades);
export const civSpecializations = derived(gameStore, $g => $g.civSpecializations);
export const tradeRoutes = derived(gameStore, $g => $g.tradeRoutes);
export const wonders = derived(gameStore, $g => $g.wonders);
