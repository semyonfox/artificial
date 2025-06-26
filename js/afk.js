/**
 * AFK System - Handles offline production and progress
 * Calculates resources gained while player was away
 */

export class AFKSystem {
	constructor(gameState, workerManager) {
		this.gameState = gameState;
		this.workerManager = workerManager;
		this.initialize();
	}

	/**
	 * Calculate offline production based on time away
	 */
	static calculateOfflineProduction(gameState, offlineTime) {
		const gameData = gameState.getState();

		if (offlineTime <= 0) return;

		console.log(
			`Calculating ${Math.floor(
				offlineTime / 1000
			)} seconds of offline production...`
		);

		// Simulate worker production during offline time
		Object.entries(gameData.workers).forEach(([workerType, count]) => {
			if (count > 0) {
				// Get worker data (simplified for AFK calculation)
				const workerData = AFKSystem.getWorkerData(workerType);
				if (workerData) {
					const cycles = Math.floor(offlineTime / workerData.workInterval);
					const fedCycles = Math.min(
						cycles,
						Math.floor(gameData.resources.cookedMeat / count)
					);

					// Apply production for fed cycles
					if (workerData.baseProduction) {
						Object.entries(workerData.baseProduction).forEach(
							([resource, amount]) => {
								gameState.addResource(resource, amount * count * fedCycles);
							}
						);
					}

					// Consume food
					gameState.addResource('cookedMeat', -count * fedCycles);
				}
			}
		});
	}

	/**
	 * Get worker data for offline calculations
	 */
	static getWorkerData(workerType) {
		const workerConfigs = {
			forager: {
				baseProduction: { sticks: 1 },
				workInterval: 8000,
			},
			hunter: {
				baseProduction: { meat: 2, bones: 1 },
				workInterval: 12000,
			},
			cook: {
				baseProduction: { cookedMeat: 1 },
				workInterval: 6000,
			},
		};

		return workerConfigs[workerType] || null;
	}

	/**
	 * Initialize AFK system
	 */
	initialize() {
		// Calculate offline production on initialization
		this.calculateOfflineProduction();

		// Set up beforeunload handler to save timestamp
		window.addEventListener('beforeunload', () => {
			localStorage.setItem('lastActive', Date.now().toString());
		});

		// Set up periodic timestamp updates
		setInterval(() => {
			localStorage.setItem('lastActive', Date.now().toString());
		}, 30000); // Every 30 seconds
	}

	/**
	 * Calculate and apply offline production
	 */
	calculateOfflineProduction() {
		const now = Date.now();
		const lastActive = localStorage.getItem('lastActive');

		if (!lastActive) {
			// First time playing, no offline production
			localStorage.setItem('lastActive', now.toString());
			return;
		}

		const offlineTime = now - parseInt(lastActive);

		// Only calculate if offline for more than 1 minute
		if (offlineTime > 60000) {
			AFKSystem.calculateOfflineProduction(this.gameState, offlineTime);

			// Show notification about offline production
			const offlineMinutes = Math.floor(offlineTime / 60000);
			if (this.gameState && this.gameState.getValue) {
				// Will be shown by UI manager when it's ready
				setTimeout(() => {
					if (
						window.game &&
						window.game.systems &&
						window.game.systems.uiManager
					) {
						window.game.systems.uiManager.showNotification(
							`Welcome back! You were away for ${offlineMinutes} minutes and your workers continued producing.`,
							'success',
							5000
						);
					}
				}, 2000);
			}
		}

		// Update last active time
		localStorage.setItem('lastActive', now.toString());
	}

	/**
	 * Get offline time in milliseconds
	 */
	getOfflineTime() {
		const now = Date.now();
		const lastActive = localStorage.getItem('lastActive');

		if (!lastActive) return 0;

		return Math.max(0, now - parseInt(lastActive));
	}

	/**
	 * Force save current timestamp
	 */
	saveCurrentTime() {
		localStorage.setItem('lastActive', Date.now().toString());
	}
}

// Legacy static methods for backward compatibility
AFKSystem.initialize = function (gameState) {
	const afkSystem = new AFKSystem(gameState);
	return afkSystem;
};
