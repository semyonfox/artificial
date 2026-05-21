import { writable, derived } from 'svelte/store';

function getStateSnapshot(gameState) {
  return {
    gameState,
    resources: { ...gameState.data.resources },
    lifetimeProduced: { ...gameState.data.lifetimeProduced },
    workers: { ...gameState.data.workers },
    upgrades: { ...gameState.data.upgrades },
    currentEra: gameState.data.currentEra,
    prestige: gameState.data.prestige || null,
    eraSpecializations: { ...gameState.data.eraSpecializations },
    civSpecializations: { ...gameState.data.civSpecializations },
    tradeRoutes: { ...gameState.data.tradeRoutes },
    wonders: { ...gameState.data.wonders },
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

  return {
    subscribe,

    initialize(gameManager) {
      const gs = gameManager.gameState;

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
        ...getStateSnapshot(gs),
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

      gs.addListener('eraAdvancement', ({ newEra }) => {
        update(s => ({
          ...s,
          currentEra: newEra,
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

      gs.addListener('gameLoaded', () => {
        update(s => ({
          ...s,
          ...getStateSnapshot(gs),
        }));
      });

      gs.addListener('gameReset', () => {
        update(s => ({
          ...s,
          ...getStateSnapshot(gs),
        }));
      });
    },

    refresh() {
      update(s => {
        if (!s.gameState) return s;
        const gs = s.gameState;
        return {
          ...s,
          ...getStateSnapshot(gs),
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
      update(s => ({
        ...s,
        eventLog: [{ ...event, timestamp: Date.now() }, ...s.eventLog].slice(0, 50),
      }));
    },

    logDisaster(disaster) {
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
