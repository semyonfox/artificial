import { config } from '../core/config.js';

/**
 * Manages all resource-related operations in the game.
 * Handles resource gathering, processing, and worker production.
 */
export class ResourceManager {
	/**
	 * Creates a new ResourceManager instance.
	 * @param {GameState} gameState - The game state instance
	 */
	constructor(gameState) {
		this.gameState = gameState;
		this.uiManager = null;
		this.gameManager = null;
	}

	/**
	 * Set UI Manager reference
	 */
	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	/**
	 * Set Game Manager reference (for prestige multiplier)
	 */
	setGameManager(gameManager) {
		this.gameManager = gameManager;
	}

	/**
	 * Get prestige production multiplier
	 */
	getPrestigeMultiplier() {
		return this.gameManager?.systems?.prestigeManager?.getMultiplier() || 1;
	}

	/**
	 * Generic click action handler - driven by era config
	 * Supports: produces, consumes, bonusChance, failChance, requiresUpgrade
	 */
	performClickAction(action) {
		// check upgrade requirement
		if (action.requiresUpgrade && !this.gameState.hasUpgrade(action.requiresUpgrade)) {
			this.uiManager?.showNotification(`Requires ${action.requiresUpgrade}`, 'warning');
			return null;
		}

		// check and consume input resources
		if (action.consumes) {
			if (!this.gameState.canAfford(action.consumes)) {
				const needed = Object.entries(action.consumes)
					.map(([r, a]) => `${a} ${r}`).join(', ');
				this.uiManager?.showNotification(`Need ${needed}`, 'warning');
				return null;
			}
			this.gameState.spendResources(action.consumes);
		}

		// check for failure
		if (action.failChance && Math.random() < action.failChance) {
			this.uiManager?.showNotification(
				action.failMessage || 'Action failed!', 'error'
			);
			return { failed: true };
		}

		const prestigeMult = this.getPrestigeMultiplier();
		const results = {};

		// guaranteed production
		if (action.produces) {
			for (const [resource, baseAmount] of Object.entries(action.produces)) {
				const efficiency = this.gameState.getEfficiencyMultiplier(resource);
				const specMult = this.gameManager?.getSpecializationMultiplier(resource) || 1;
				const amount = Math.max(1, Math.floor(baseAmount * efficiency * prestigeMult * specMult));
				this.gameState.addResource(resource, amount);
				results[resource] = amount;
			}
		}

		// bonus chance drops
		if (action.bonusChance) {
			for (const [resource, info] of Object.entries(action.bonusChance)) {
				if (Math.random() < info.probability) {
					const amount = info.amount || 1;
					this.gameState.addResource(resource, amount);
					results[resource] = (results[resource] || 0) + amount;
				}
			}
		}

		this.showGatheringResult(action.name, results);
		return results;
	}

	/**
	 * Process worker production for a specific worker type
	 */
	processWorkerProduction(workerType, workerData) {
		const workerCount = this.gameState.getWorkerCount(workerType);
		if (workerCount === 0) return null;
		
		let successfulWorkers = 0;
		let failedWorkers = 0;
		const totalProduction = {};
		
		for (let i = 0; i < workerCount; i++) {
			const workerResult = this.processIndividualWorker(workerType, workerData);
			
			if (workerResult.success) {
				successfulWorkers++;
				
				// Add to total production
				Object.entries(workerResult.production).forEach(([resource, amount]) => {
					totalProduction[resource] = (totalProduction[resource] || 0) + amount;
				});
			} else {
				failedWorkers++;
			}
		}
		
		// Apply total production
		Object.entries(totalProduction).forEach(([resource, amount]) => {
			this.gameState.addResource(resource, amount);
		});
		
		// Show results
		if (successfulWorkers > 0) {
			this.showWorkerResult(workerType, successfulWorkers, totalProduction);
		}
		
		if (failedWorkers > 0) {
			this.uiManager?.showNotification(
				`${failedWorkers} ${workerData.name}(s) couldn't work (need resources)`,
				'warning'
			);
		}
		
		return {
			successfulWorkers,
			failedWorkers,
			totalProduction,
		};
	}

	/**
	 * Process production for a single worker
	 */
	processIndividualWorker(workerType, workerData) {
		// Check if worker can consume required resources
		if (workerData.consumes) {
			if (!this.gameState.canAfford(workerData.consumes)) {
				return { success: false, reason: 'insufficient_resources' };
			}
			
			// Consume resources
			this.gameState.spendResources(workerData.consumes);
		}
		
		// Calculate production with efficiency bonuses
		const production = {};
		
		if (workerData.produces) {
			Object.entries(workerData.produces).forEach(([resource, baseAmount]) => {
				const efficiency = this.gameState.getEfficiencyMultiplier(resource);
				const actualAmount = baseAmount * efficiency;
				production[resource] = actualAmount;
			});
		}
		
		return { success: true, production };
	}

	/**
	 * Show gathering result notification
	 */
	showGatheringResult(action, results) {
		if (!this.uiManager) return;
		
		// Throttle notifications - only show every 3 clicks
		if (!this.gatheringNotificationCount) this.gatheringNotificationCount = 0;
		this.gatheringNotificationCount++;

		if (this.gatheringNotificationCount < 3) return;
		this.gatheringNotificationCount = 0;

		const resultText = Object.entries(results)
			.map(([resource, amount]) => `${amount} ${resource}`)
			.join(', ');
		
		this.uiManager.showNotification(`${action}: +${resultText}`, 'success', 2000);
	}

	/**
	 * Show worker production result
	 */
	showWorkerResult(workerType, count, production) {
		if (!this.uiManager) return;
		
		// Throttle worker notifications - only show every 5 productions
		if (!this.workerNotificationCount) this.workerNotificationCount = {};
		if (!this.workerNotificationCount[workerType]) this.workerNotificationCount[workerType] = 0;
		this.workerNotificationCount[workerType]++;

		if (this.workerNotificationCount[workerType] < 5) return;
		this.workerNotificationCount[workerType] = 0;

		const productionText = Object.entries(production)
			.map(([resource, amount]) => `${Math.floor(amount * 10) / 10} ${resource}`)
			.join(', ');
		
		this.uiManager.showNotification(
			`${count} ${workerType}(s) produced: ${productionText}`,
			'success',
			2000
		);
	}

	/**
	 * Calculate total resource value for progression tracking
	 */
	calculateTotalResourceValue() {
		const state = this.gameState.getState();
		let totalValue = 0;
		
		Object.entries(state.resources).forEach(([resource, amount]) => {
			const weight = this.getResourceWeight(resource);
			totalValue += amount * weight;
		});
		
		return totalValue;
	}

	/**
	 * Get resource weight for progression calculation
	 */
	getResourceWeight(resource) {
		const weights = {
			// Basic resources
			sticks: 1,
			stones: 2,
			meat: 3,
			cookedMeat: 5,
			bones: 4,
			fur: 6,
			population: 20,
			
			// Advanced resources have higher weights
			grain: 10,
			pottery: 15,
			bronze: 25,
			writing: 30,
			steel: 40,
			electricity: 60,
			computers: 100,
		};
		
		return weights[resource] || 10; // Default weight
	}
}
