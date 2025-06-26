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
		// Update worker timers and check for completed work
		// This is handled by intervals, but we could add additional logic here
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
	 */
	performWorkerWork(workerType, workerData) {
		const gameData = this.gameState.getState();
		const workerCount = gameData.workers[workerType] || 0;

		if (workerCount === 0) {
			this.stopWorkerAutomation(workerType);
			return;
		}

		// Check worker food status and efficiency
		const foodStatus = this.updateWorkerFoodConsumption();
		const efficiency = this.getWorkerEfficiency(foodStatus);

		let workersWorked = 0;
		let unfedWorkers = 0;

		// Process each worker
		for (let i = 0; i < workerCount; i++) {
			// Check if worker needs input resources (for cooks)
			if (workerData.consumes) {
				let canWork = true;
				for (const [resource, amount] of Object.entries(workerData.consumes)) {
					if ((gameData.resources[resource] || 0) < amount) {
						canWork = false;
						break;
					}
				}

				if (!canWork) {
					unfedWorkers++;
					continue;
				}

				// Consume required resources
				for (const [resource, amount] of Object.entries(workerData.consumes)) {
					this.gameState.addResource(resource, -amount);
				}
			}

			// Worker works and produces resources with efficiency modifier
			if (workerData.produces) {
				for (const [resource, amount] of Object.entries(workerData.produces)) {
					const effectiveAmount = Math.floor(amount * efficiency);
					this.gameState.addResource(resource, effectiveAmount);
				}
			}

			workersWorked++;
		}

		// Show notification about work done
		if (workersWorked > 0) {
			const produced = Object.entries(workerData.produces || {})
				.map(([resource, amount]) => {
					const effectiveAmount = Math.floor(
						amount * efficiency * workersWorked
					);
					return `${effectiveAmount} ${resource}`;
				})
				.join(', ');

			if (produced) {
				let message = `${workersWorked} ${workerData.name}(s) produced: ${produced}`;
				if (efficiency < 1.0) {
					message += ` (${Math.round(
						efficiency * 100
					)}% efficiency due to food shortage)`;
				}

				this.uiManager?.showNotification(message, 'success');
			}
		}

		// Show notification for workers that couldn't work
		if (unfedWorkers > 0) {
			const missingResources = Object.keys(workerData.consumes || {}).join(
				', '
			);
			this.uiManager?.showNotification(
				`${unfedWorkers} ${workerData.name}(s) need ${missingResources} to work`,
				'warning'
			);
		}

		this.updateUI?.();
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

		// Fallback to basic paleolithic data
		const gameData = this.gameState.getState();
		const currentEra = gameData.currentEra;

		if (currentEra === 'paleolithic') {
			return {
				workers: [
					{
						id: 'gatherer',
						name: 'Gatherer',
						cost: { sticks: 8, cookedMeat: 2 },
						produces: { sticks: 1, stones: 0.3 },
						interval: 4000,
					},
					{
						id: 'hunter',
						name: 'Hunter',
						cost: { stones: 12, bones: 3, cookedMeat: 4 },
						produces: { meat: 1, bones: 0.4, fur: 0.3 },
						interval: 6000,
						requiresUpgrade: 'stoneKnapping',
					},
					{
						id: 'cook',
						name: 'Cook',
						cost: { sticks: 15, stones: 3, fire: 1, cookedMeat: 1 },
						produces: { cookedMeat: 2, fire: 0.1 },
						consumes: { meat: 1 },
						interval: 3000,
						requiresUpgrade: 'fireControl',
					},
				],
			};
		}

		return null;
	}

	/**
	 * Update worker food consumption
	 */
	updateWorkerFoodConsumption() {
		const gameData = this.gameState.getState();
		const foodConsumption = this.gameState.getWorkerFoodConsumption();

		if (foodConsumption > 0) {
			const availableFood = gameData.resources.cookedMeat || 0;

			if (availableFood >= foodConsumption) {
				// Workers are well fed
				this.gameState.addResource('cookedMeat', -foodConsumption);
				return 'wellFed';
			} else if (availableFood > 0) {
				// Workers are partially fed
				this.gameState.addResource('cookedMeat', -availableFood);
				return 'hungry';
			} else {
				// Workers are starving
				return 'starving';
			}
		}

		return 'wellFed';
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
