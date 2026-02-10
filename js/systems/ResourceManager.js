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
		
		console.log('ResourceManager initialized');
	}

	/**
	 * Set UI Manager reference
	 */
	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	/**
	 * Perform foraging action - gather sticks and occasionally stones
	 */
	forage() {
		const baseYield = config.yields.forageYield;
		const stickMultiplier = this.gameState.getEfficiencyMultiplier('sticks');
		
		// Calculate stick yield
		const stickYield = Math.max(1, Math.floor(baseYield * stickMultiplier));
		this.gameState.addResource('sticks', stickYield);
		
		// Chance for stones
		if (Math.random() < config.probabilities.stoneChanceFromSticks) {
			const stoneYield = Math.max(
				1,
				Math.floor(baseYield * 0.5 * this.gameState.getEfficiencyMultiplier('stones'))
			);
			this.gameState.addResource('stones', stoneYield);
		}
		
		// Show notification
		this.showGatheringResult('Foraged', { sticks: stickYield });
		
		return { sticks: stickYield };
	}

	/**
	 * Hunt animals for meat, bones, and fur - requires stone knapping
	 */
	huntAnimal() {
		if (!this.gameState.hasUpgrade('stoneKnapping')) {
			this.uiManager?.showNotification('Need Stone Knapping to hunt!', 'warning');
			return null;
		}
		
		const baseYield = config.yields.huntYield;
		const meatMultiplier = this.gameState.getEfficiencyMultiplier('meat');
		
		// Calculate yields
		const meatYield = Math.max(1, Math.floor(baseYield * meatMultiplier));
		const boneYield = Math.random() < 0.6 ? 1 : 0;
		const furYield = Math.random() < config.probabilities.furDropChance ? 1 : 0;
		
		// Add resources
		this.gameState.addResource('meat', meatYield);
		if (boneYield > 0) this.gameState.addResource('bones', boneYield);
		if (furYield > 0) this.gameState.addResource('fur', furYield);
		
		// Show notification
		const results = { meat: meatYield };
		if (boneYield > 0) results.bones = boneYield;
		if (furYield > 0) results.fur = furYield;
		
		this.showGatheringResult('Hunted', results);
		
		return results;
	}

	/**
	 * Cook raw meat into cooked meat - requires fire control
	 */
	cookMeatClick() {
		if (!this.gameState.hasUpgrade('fireControl')) {
			this.uiManager?.showNotification('Need Fire Control to cook!', 'warning');
			return null;
		}
		
		if (this.gameState.getResource('meat') < 1) {
			this.uiManager?.showNotification('Need raw meat to cook!', 'warning');
			return null;
		}
		
		// Consume raw meat
		this.gameState.addResource('meat', -1);
		
		// Chance of burning (failure)
		if (Math.random() < config.probabilities.burnChance) {
			this.uiManager?.showNotification('The meat burned while cooking!', 'error');
			return { failed: true };
		}
		
		// Successful cooking - 1 meat yields 1 cooked meat
		const cookedYield = 1;
		this.gameState.addResource('cookedMeat', cookedYield);
		
		this.showGatheringResult('Cooked', { cookedMeat: cookedYield });
		
		return { cookedMeat: cookedYield };
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
