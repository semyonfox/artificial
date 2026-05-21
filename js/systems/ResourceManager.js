import { config } from '../core/config.js';
import { formatResourceList } from '../core/resourceUtils.js';

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
			this.gameManager?.showNotification(`Requires ${action.requiresUpgrade}`, 'warning');
			return null;
		}

		// check and consume input resources
		if (action.consumes) {
			if (!this.gameState.canAfford(action.consumes)) {
				const needed = formatResourceList(action.consumes);
				this.gameManager?.showNotification(`Need ${needed}`, 'warning');
				return null;
			}
			this.gameState.spendResources(action.consumes);
		}

		// check for failure
		if (action.failChance && Math.random() < action.failChance) {
			this.gameManager?.showNotification(
				action.failMessage || 'Action failed!', 'error'
			);
			return { failed: true };
		}

		const prestigeMult = this.getPrestigeMultiplier();
		const pm = this.gameManager?.systems?.prestigeManager;
		const wm = this.gameManager?.systems?.workerManager;
		const results = {};

		// guaranteed production (with mastery + soft cap)
		if (action.produces) {
			for (const [resource, baseAmount] of Object.entries(action.produces)) {
				const amount = this.calculateProductionAmount(resource, baseAmount, {
					prestigeMult,
					pm,
					wm,
				});
				this.gameState.addResource(resource, amount);
				results[resource] = amount;
			}
		}

		// bonus chance drops (scale with multipliers like guaranteed production)
		if (action.bonusChance) {
			for (const [resource, info] of Object.entries(action.bonusChance)) {
				if (Math.random() < info.probability) {
					const baseAmount = info.amount || 1;
					const amount = this.calculateProductionAmount(resource, baseAmount, {
						prestigeMult,
						pm,
						wm,
					});
					this.gameState.addResource(resource, amount);
					results[resource] = (results[resource] || 0) + amount;
				}
			}
		}

		this.showGatheringResult(action.name, results);
		return results;
	}

	calculateProductionAmount(resource, baseAmount, { prestigeMult, pm, wm } = {}) {
		const efficiency = this.gameState.getEfficiencyMultiplier(resource);
		const specMult = this.gameManager?.getSpecializationMultiplier(resource) || 1;
		const masteryMult = pm?.getMasteryMultiplier(resource) || 1;
		const capMult = wm?.getSoftCapMultiplier(resource) ?? 1;
		return Math.max(1, Math.floor(baseAmount * efficiency * prestigeMult * specMult * masteryMult * capMult));
	}

	/**
	 * Show gathering result notification
	 */
	showGatheringResult(action, results) {
		if (!this.gameManager) return;

		// Throttle notifications - only show every 3 clicks
		if (!this.gatheringNotificationCount) this.gatheringNotificationCount = 0;
		this.gatheringNotificationCount++;

		if (this.gatheringNotificationCount < 3) return;
		this.gatheringNotificationCount = 0;

		const resultText = formatResourceList(results);

		this.gameManager.showNotification(`${action}: +${resultText}`, 'success', 2000);
	}

	/**
	 * Show worker production result
	 */
	showWorkerResult(workerType, count, production) {
		if (!this.gameManager) return;

		// Throttle worker notifications - only show every 5 productions
		if (!this.workerNotificationCount) this.workerNotificationCount = {};
		if (!this.workerNotificationCount[workerType]) this.workerNotificationCount[workerType] = 0;
		this.workerNotificationCount[workerType]++;

		if (this.workerNotificationCount[workerType] < 5) return;
		this.workerNotificationCount[workerType] = 0;

		const productionText = formatResourceList(
			production,
			(resource) => resource,
			(amount) => Math.floor(amount * 10) / 10,
		);

		this.gameManager.showNotification(
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
