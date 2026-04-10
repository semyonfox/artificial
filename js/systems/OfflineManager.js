/**
 * Offline Manager - Calculates and applies resource production while player was away
 */

import { config } from '../core/config.js';

export class OfflineManager {
	constructor(gameState) {
		this.gameState = gameState;

		// save timestamp on unload
		window.addEventListener('beforeunload', () => {
			localStorage.setItem('lastActive', Date.now().toString());
		});
	}

	/**
	 * Calculate and apply offline production. Call once on game load.
	 * Returns summary object or null if no meaningful offline time.
	 */
	applyOfflineProduction(gameManager) {
		const lastActive = localStorage.getItem('lastActive');
		if (!lastActive) {
			localStorage.setItem('lastActive', Date.now().toString());
			return null;
		}

		const offlineMs = Date.now() - parseInt(lastActive);
		localStorage.setItem('lastActive', Date.now().toString());

		// ignore if less than 1 minute
		if (offlineMs < 60000) return null;

		const eraData = gameManager.getCurrentEraData();
		if (!eraData?.workers) return null;

		const gameData = this.gameState.getState();
		const produced = {};

		eraData.workers.forEach((workerData) => {
			const count = gameData.workers[workerData.id] || 0;
			if (count <= 0 || !workerData.produces) return;

			const interval = workerData.interval || 10000;
			const cycles = Math.floor(offlineMs / interval);

			// offline workers run at 50% efficiency (no food management)
			const efficiency = 0.5;

			Object.entries(workerData.produces).forEach(([resource, basePerWorker]) => {
				const amount = Math.floor(basePerWorker * count * cycles * efficiency);
				if (amount > 0) {
					this.gameState.addResource(resource, amount);
					produced[resource] = (produced[resource] || 0) + amount;
				}
			});
		});

		if (Object.keys(produced).length === 0) return null;

		return {
			offlineMinutes: Math.floor(offlineMs / 60000),
			produced,
		};
	}
}
