export class AFKSystem {
  static calculateOfflineProduction() {
    const now = Date.now();
    const lastActive = localStorage.getItem('lastActive');
    const offlineTime = lastActive ? now - parseInt(lastActive) : 0;

    if (offlineTime > 0) {
      Object.entries(gameState.workers).forEach(([workerType, count]) => {
        if (count > 0) {
          const workerConfig = config.baseWorkerStats[workerType];
          const interval = config.workerSpeed[workerConfig.speed];
          const cycles = Math.floor(offlineTime / interval);

          Object.entries(workerConfig.baseProduction).forEach(
            ([resource, value]) => {
              gameState.resources[resource] += value * count * cycles;
            }
          );
        }
      });
    }

    // Update last active time
    gameState.lastUpdate = now;
    localStorage.setItem('lastActive', now);
  }

  static initialize() {
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('lastActive', Date.now());
    });

    this.calculateOfflineProduction();
  }
}

// Initialize when game loads
AFKSystem.initialize();
