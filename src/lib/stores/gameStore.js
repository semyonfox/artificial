import { writable, derived } from 'svelte/store';

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
        gameState: gs,
        resources: { ...gs.data.resources },
        lifetimeProduced: { ...gs.data.lifetimeProduced },
        workers: { ...gs.data.workers },
        upgrades: { ...gs.data.upgrades },
        currentEra: gs.data.currentEra,
        prestige: gs.data.prestige || null,
        eraSpecializations: { ...gs.data.eraSpecializations },
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

      gs.addListener('gameLoaded', () => {
        update(s => ({
          ...s,
          resources: { ...gs.data.resources },
          lifetimeProduced: { ...gs.data.lifetimeProduced },
          workers: { ...gs.data.workers },
          upgrades: { ...gs.data.upgrades },
          currentEra: gs.data.currentEra,
          prestige: gs.data.prestige || null,
          eraSpecializations: { ...gs.data.eraSpecializations },
        }));
      });

      gs.addListener('gameReset', () => {
        update(s => ({
          ...s,
          resources: { ...gs.data.resources },
          lifetimeProduced: { ...gs.data.lifetimeProduced },
          workers: { ...gs.data.workers },
          upgrades: { ...gs.data.upgrades },
          currentEra: gs.data.currentEra,
          prestige: null,
          eraSpecializations: {},
        }));
      });
    },

    refresh() {
      update(s => {
        if (!s.gameState) return s;
        const gs = s.gameState;
        return {
          ...s,
          resources: { ...gs.data.resources },
          lifetimeProduced: { ...gs.data.lifetimeProduced },
          workers: { ...gs.data.workers },
          upgrades: { ...gs.data.upgrades },
          currentEra: gs.data.currentEra,
          prestige: gs.data.prestige || null,
          eraSpecializations: { ...gs.data.eraSpecializations },
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
