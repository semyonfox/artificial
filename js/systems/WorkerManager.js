/**
 * Worker Manager - Handles automated worker systems
 * Manages hiring, feeding, and production of workers
 */

import { config } from '../core/config.js';

export class WorkerManager {
	constructor(gameState) {
		this.gameState = gameState;
		this.uiManager = null;
		this.gameManager = null;
		this.workerIntervals = new Map();
		this.workerTimers = new Map();

		// Accumulate fractional production so small yields (e.g., 0.3 stones) add up
		this.productionRemainders = {}; // { resource: fractionalRemainder }

		// Track last known food status per worker type for UI display
		this.lastFoodStatusByWorker = {}; // { workerType: 'wellFed' | 'hungry' | 'starving' }

		console.log('WorkerManager initialized');
	}

	/**
	 * Set UI manager reference
	 */
	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	/**
	 * Set game manager reference
	 */
	setGameManager(gameManager) {
		this.gameManager = gameManager;
	}

	/**
	 * Update method called from game loop
	 */
	update(deltaTime) {
		// Intervals handle production; no per-frame logic needed yet
	}

	/**
	 * Hire a new worker
	 */
	hireWorker(workerType) {
		const gameData = this.gameState.getState();

		// Get worker data from GameManager
		if (!this.gameManager) {
			this.uiManager?.showNotification('GameManager not available', 'error');
			return false;
		}

		const currentEraData = this.gameManager.getCurrentEraData();

		if (!currentEraData || !currentEraData.workers) {
			this.uiManager?.showNotification(
				'No workers available in this era',
				'error'
			);
			return false;
		}

		const workerData = currentEraData.workers.find((w) => w.id === workerType);
		if (!workerData) {
			this.uiManager?.showNotification('Worker type not found', 'error');
			return false;
		}

		// Check upgrade requirements
		if (
			workerData.requiresUpgrade &&
			!gameData.upgrades[workerData.requiresUpgrade]
		) {
			this.uiManager?.showNotification(
				`${workerData.name} requires the ${workerData.requiresUpgrade} upgrade!`,
				'error'
			);
			return false;
		}

		// Calculate cost (increases with each worker)
		const currentCount = gameData.workers[workerType] || 0;
		const cost = this.calculateWorkerCost(workerData.cost, currentCount);

		// Check if player can afford it
		if (!this.gameState.canAfford(cost)) {
			this.uiManager?.showNotification(
				`Cannot afford ${workerData.name}`,
				'error'
			);
			return false;
		}

		// Spend resources and hire worker
		if (this.gameState.spendResources(cost)) {
			this.gameState.addWorker(workerType, 1);

			// Start worker automation
			this.startWorkerAutomation(workerType, workerData);

			this.uiManager?.showNotification(`Hired ${workerData.name}!`, 'success');

			return true;
		}

		return false;
	}

	/**
	 * Calculate worker cost with scaling
	 */
	calculateWorkerCost(baseCost, workerCount) {
		const multiplier = Math.pow(1.5, workerCount);
		const cost = {};

		Object.entries(baseCost).forEach(([resource, amount]) => {
			cost[resource] = Math.ceil(amount * multiplier);
		});

		return cost;
	}

	/**
	 * Start automated worker production
	 */
	startWorkerAutomation(workerType, workerData) {
		// Clear existing interval if any
		this.stopWorkerAutomation(workerType);

		const interval = workerData.interval || 10000; // Default 10 seconds

		const workFunction = () => {
			this.performWorkerWork(workerType, workerData);
		};

		// Start immediate work and set up interval
		workFunction();
		const intervalId = setInterval(workFunction, interval);
		this.workerIntervals.set(workerType, intervalId);
	}

	/**
	 * Stop worker automation
	 */
	stopWorkerAutomation(workerType) {
		const intervalId = this.workerIntervals.get(workerType);
		if (intervalId) {
			clearInterval(intervalId);
			this.workerIntervals.delete(workerType);
		}
	}

	/**
	 * Perform work for a specific worker type
	 * - Consumes food proportional to this worker type only
	 * - Applies efficiency and accumulates fractional production
	 * - Suppresses per-tick notifications (UI will show per-second deltas)
	 */
	performWorkerWork(workerType, workerData) {
		const gameData = this.gameState.getState();
		const workerCount = gameData.workers[workerType] || 0;
		if (workerCount === 0) {
			this.stopWorkerAutomation(workerType);
			return;
		}

		// Determine food status for this worker group and consume proportionally
		const baseConsumptionPerWorker = config.gameVariables?.workerFoodConsumption || 1;
		const requiredFood = workerCount * baseConsumptionPerWorker;
		const availableFood = this.gameState.getResource('cookedMeat');

		let status = 'wellFed';
		let efficiency = 1.0;
		if (requiredFood <= 0) {
			status = 'wellFed';
			efficiency = 1.0;
		} else if (availableFood >= requiredFood) {
			// Fully fed
			this.gameState.addResource('cookedMeat', -requiredFood);
			status = 'wellFed';
			efficiency = this.getWorkerEfficiency('wellFed');
		} else if (availableFood > 0) {
			// Partially fed -> hungry
			this.gameState.addResource('cookedMeat', -availableFood);
			status = 'hungry';
			efficiency = this.getWorkerEfficiency('hungry');
		} else {
			// No food -> starving
			status = 'starving';
			efficiency = this.getWorkerEfficiency('starving');
		}
		this.lastFoodStatusByWorker[workerType] = status;

		// If worker needs input resources (e.g., cooks), check availability per worker
		let workersAbleToWork = 0;
		if (workerData.consumes) {
			// Determine how many workers can be fully supplied
			let maxWorkersByInput = Infinity;
			for (const [resource, perWorkerAmount] of Object.entries(workerData.consumes)) {
				const available = this.gameState.getResource(resource);
				const possible = Math.floor(available / perWorkerAmount);
				maxWorkersByInput = Math.min(maxWorkersByInput, possible);
			}
			workersAbleToWork = Math.max(0, Math.min(workerCount, maxWorkersByInput));

			// Consume inputs for those workers
			for (const [resource, perWorkerAmount] of Object.entries(workerData.consumes)) {
				const totalConsume = workersAbleToWork * perWorkerAmount;
				if (totalConsume > 0) this.gameState.addResource(resource, -totalConsume);
			}
		} else {
			workersAbleToWork = workerCount;
		}

		if (workersAbleToWork <= 0 || !workerData.produces) {
			return;
		}

		// Compute total production with efficiency (not floored); accumulate fractional parts
		for (const [resource, basePerWorker] of Object.entries(workerData.produces)) {
			const total = basePerWorker * workersAbleToWork * efficiency;
			const prevRemainder = this.productionRemainders[resource] || 0;
			const combined = prevRemainder + total;
			const whole = Math.floor(combined);
			const remainder = combined - whole;

			this.productionRemainders[resource] = remainder;
			if (whole !== 0) {
				this.gameState.addResource(resource, whole);
			}
		}

		// Suppress per-tick notifications; UI deltas will reflect changes once per second
	}

	/** Get last known food status for a worker type (for UI badges) */
	getFoodStatus(workerType) {
		return this.lastFoodStatusByWorker[workerType] || 'wellFed';
	}

	/**
	 * Feed a worker (check for required resources)
	 */
	feedWorker(workerData) {
		const gameData = this.gameState.getState();

		// Check if worker needs input resources
		if (workerData.inputRequired) {
			for (const [resource, amount] of Object.entries(
				workerData.inputRequired
			)) {
				if ((gameData.resources[resource] || 0) < amount) {
					return false;
				}
			}

			// Consume input resources
			for (const [resource, amount] of Object.entries(
				workerData.inputRequired
			)) {
				this.gameState.addResource(resource, -amount);
			}
		}

		// Standard worker feeding with cooked meat
		if ((gameData.resources.cookedMeat || 0) >= 1) {
			this.gameState.addResource('cookedMeat', -1);
			return true;
		}

		return false;
	}

	/**
	 * Produce resources from worker
	 */
	produceResources(workerData) {
		// Base production
		if (workerData.baseProduction) {
			for (const [resource, amount] of Object.entries(
				workerData.baseProduction
			)) {
				this.gameState.addResource(resource, amount);
			}
		}

		// Bonus production (with probability)
		if (workerData.bonusProduction) {
			for (const [resource, chance] of Object.entries(
				workerData.bonusProduction
			)) {
				if (Math.random() < chance) {
					this.gameState.addResource(resource, 1);
				}
			}
		}

		// Handle failure chance (for cooks)
		if (workerData.failureChance && Math.random() < workerData.failureChance) {
			// Production failed, maybe show notification
			this.uiManager?.showNotification(
				'A worker failed at their task!',
				'warning',
				1000
			);
		}
	}

	/**
	 * Start all worker automations for current era
	 */
	startAllWorkerAutomations() {
		const gameData = this.gameState.getState();
		const currentEraData = this.getCurrentEraData();

		if (!currentEraData || !currentEraData.workers) return;

		// Start automation for all workers that have been hired
		currentEraData.workers.forEach((workerData) => {
			const workerCount = gameData.workers[workerData.id] || 0;
			if (workerCount > 0) {
				this.startWorkerAutomation(workerData.id, workerData);
			}
		});
	}

	/**
	 * Stop all worker automations
	 */
	stopAllWorkerAutomations() {
		this.workerIntervals.forEach((intervalId, workerType) => {
			clearInterval(intervalId);
		});
		this.workerIntervals.clear();
	}

	/**
	 * Stop all worker automation
	 */
	stopAllWorkers() {
		for (const intervalId of this.workerIntervals.values()) {
			clearInterval(intervalId);
		}
		this.workerIntervals.clear();
		console.log('All worker automation stopped');
	}

	/**
	 * Restart automation for all active workers
	 */
	restartAllWorkers() {
		const gameData = this.gameState.getState();

		if (!this.gameManager) {
			console.warn('Cannot restart workers: GameManager not available');
			return;
		}

		const currentEraData = this.gameManager.getCurrentEraData();
		if (!currentEraData || !currentEraData.workers) {
			return;
		}

		// Stop all existing automation first
		this.stopAllWorkers();

		// Restart automation for each worker type that has active workers
		Object.entries(gameData.workers).forEach(([workerType, count]) => {
			if (count > 0) {
				const workerData = currentEraData.workers.find(
					(w) => w.id === workerType
				);
				if (workerData) {
					this.startWorkerAutomation(workerType, workerData);
				}
			}
		});

		console.log('Worker automation restarted for active workers');
	}

	/**
	 * Get current era data (helper method)
	 */
	getCurrentEraData() {
		// Get era data from GameManager if available
		if (this.gameManager && this.gameManager.getCurrentEraData) {
			return this.gameManager.getCurrentEraData();
		}

		// Fallback to config if GameManager not available yet
		const gameData = this.gameState.getState();
		const currentEra = gameData.currentEra;
		return config.eraData?.[currentEra] || config.eraData?.paleolithic || null;
	}


	/**
	 * Get worker efficiency based on food status
	 */
	getWorkerEfficiency(foodStatus = 'wellFed') {
		const efficiencyRates = config.balance?.workerEfficiency;
		if (!efficiencyRates) return 1.0;

		return efficiencyRates[foodStatus] || 1.0;
	}

	/**
	 * Get detailed worker information for UI
	 */
	getWorkerInfo(workerType) {
		if (!this.gameManager) return null;

		const currentEraData = this.gameManager.getCurrentEraData();
		const workerData = currentEraData?.workers?.find(
			(w) => w.id === workerType
		);
		const gameData = this.gameState.getState();
		const count = gameData.workers[workerType] || 0;

		if (!workerData) return null;

		return {
			...workerData,
			count,
			cost: this.calculateWorkerCost(workerData.cost, count),
			canHire: this.gameState.canAfford(
				this.calculateWorkerCost(workerData.cost, count)
			),
			requirementMet:
				!workerData.requiresUpgrade ||
				gameData.upgrades[workerData.requiresUpgrade],
		};
	}

	/**
	 * Cleanup all worker systems
	 */
	destroy() {
		this.stopAllWorkerAutomations();
	}
}
