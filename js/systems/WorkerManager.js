/**
 * Worker Manager - Handles automated worker systems
 * Manages hiring, feeding, and production of workers
 *
 * Balance changes:
 * - Cost scaling: 1.15^n (was 1.5^n)
 * - Diminishing returns: each duplicate worker -5% efficiency
 * - Food: 1 per 3 work cycles, not 1 per cycle
 * - Efficiency: wellFed 100%, hungry 60%, starving 20%
 * - Workers never hard-stop; efficiency degrades gracefully
 */

import { config } from '../core/config.js';
import { getEraIndex, scaleCost } from '../core/resourceUtils.js';

export class WorkerManager {
	constructor(gameState) {
		this.gameState = gameState;
		this.uiManager = null;
		this.gameManager = null;
		this.workerIntervals = new Map();
		this.workerTimers = new Map();

		// accumulate fractional production so small yields add up
		this.productionRemainders = {};

		// track work cycles per worker type for food consumption pacing
		this.workCycleCounts = {};

		// track last known food status per worker type for UI
		this.lastFoodStatusByWorker = {};
	}

	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	setGameManager(gameManager) {
		this.gameManager = gameManager;
	}

	notify(message, type = 'info', duration = 2000) {
		if (this.gameManager) {
			this.gameManager.showNotification(message, type, duration);
		} else {
			this.uiManager?.showNotification(message, type, duration);
		}
	}

	update(deltaTime) {
		// intervals handle production; no per-frame logic needed
	}

	/**
	 * Hire a new worker
	 */
	hireWorker(workerType) {
		const gameData = this.gameState.getState();

		if (!this.gameManager) {
			this.notify('GameManager not available', 'error');
			return false;
		}

		const currentEraData = this.gameManager.getCurrentEraData();
		if (!currentEraData || !currentEraData.workers) {
			this.notify('No workers available in this era', 'error');
			return false;
		}

		const workerData = currentEraData.workers.find((w) => w.id === workerType);
		if (!workerData) {
			this.notify('Worker type not found', 'error');
			return false;
		}

		// check upgrade requirements
		if (workerData.requiresUpgrade && !gameData.upgrades[workerData.requiresUpgrade]) {
			this.notify(
				`${workerData.name} requires the ${workerData.requiresUpgrade} upgrade!`,
				'error'
			);
			return false;
		}

		if (this.gameState.getAvailablePopulation() < 1) {
			this.notify(`Need more population for ${workerData.name}`, 'warning');
			return false;
		}

		// calculate cost with new 1.15^n scaling and prestige discount
		const currentCount = gameData.workers[workerType] || 0;
		const cost = this.calculateWorkerCost(workerData.cost, currentCount);

		if (!this.gameState.canAfford(cost)) {
			this.notify(`Cannot afford ${workerData.name}`, 'error');
			return false;
		}

		if (this.gameState.spendResources(cost)) {
			if (!this.gameState.addWorker(workerType, 1)) {
				Object.entries(cost).forEach(([resource, amount]) => {
					this.gameState.addResource(resource, amount);
				});
				this.notify(`Need more population for ${workerData.name}`, 'warning');
				return false;
			}
			this.startWorkerAutomation(workerType, workerData);
			this.notify(`Hired ${workerData.name}!`, 'success');
			return true;
		}

		return false;
	}

	/**
	 * Calculate worker cost with 1.15^n scaling (was 1.5^n)
	 * Also applies prestige masterCrafter perk discount
	 */
	calculateWorkerCost(baseCost, workerCount) {
		const scalingBase = config.balance?.workerCostScaling || 1.15;
		const multiplier = Math.pow(scalingBase, workerCount);

		// prestige perk discount
		const perkMult = this.gameManager?.systems?.prestigeManager?.getWorkerCostMultiplier() || 1;

		return scaleCost(baseCost, multiplier * perkMult);
	}

	/**
	 * Get diminishing returns multiplier for a worker type
	 * Each successive worker of same type is 5% less efficient
	 * 1st: 100%, 2nd: 95%, 3rd: 90%, etc.
	 */
	getDiminishingReturnsFactor(workerType) {
		const count = this.gameState.getWorkerCount(workerType);
		if (count <= 1) return 1.0;

		const diminish = config.balance?.workerDiminishingReturns || 0.05;
		// average efficiency across all workers of this type
		// sum of (1 - i*diminish) for i=0..count-1, divided by count
		let totalEfficiency = 0;
		for (let i = 0; i < count; i++) {
			totalEfficiency += Math.max(0.2, 1 - i * diminish); // floor at 20%
		}
		return totalEfficiency / count;
	}

	/**
	 * Get effective worker interval, accounting for prestige perks
	 */
	getEffectiveInterval(workerData) {
		let interval = workerData.interval || 10000;

		// prestige perk interval reduction
		const pm = this.gameManager?.systems?.prestigeManager;
		if (pm) {
			interval *= pm.getWorkerIntervalMultiplier();
		}

		// robotic age specialization: -20% intervals
		const specs = this.gameState.data.eraSpecializations;
		if (specs?.industrial === 'roboticAge') {
			interval *= 0.80;
		}

		return Math.max(500, Math.round(interval)); // floor at 500ms
	}

	/**
	 * Start automated worker production
	 */
	startWorkerAutomation(workerType, workerData) {
		this.stopWorkerAutomation(workerType);

		const interval = this.getEffectiveInterval(workerData);

		const workFunction = () => {
			this.performWorkerWork(workerType, workerData);
		};

		workFunction();
		const intervalId = setInterval(workFunction, interval);
		this.workerIntervals.set(workerType, intervalId);
	}

	stopWorkerAutomation(workerType) {
		const intervalId = this.workerIntervals.get(workerType);
		if (intervalId) {
			clearInterval(intervalId);
			this.workerIntervals.delete(workerType);
		}
	}

	/**
	 * Perform work for a specific worker type
	 * - Food consumed every 3 work cycles (not every cycle)
	 * - Diminishing returns applied per worker type
	 * - Specialization bonuses applied to production
	 */
	performWorkerWork(workerType, workerData) {
		const gameData = this.gameState.getState();
		const workerCount = gameData.workers[workerType] || 0;
		if (workerCount === 0) {
			this.stopWorkerAutomation(workerType);
			return;
		}

		// track work cycles for food consumption pacing
		if (!this.workCycleCounts[workerType]) this.workCycleCounts[workerType] = 0;
		this.workCycleCounts[workerType]++;

		const foodInterval = config.gameVariables?.workerFoodCycleInterval || 3;
		const shouldConsumeFood = this.workCycleCounts[workerType] % foodInterval === 0;

		// determine food resource based on era
		const currentEra = this.gameState.data.currentEra;
		const eraIdx = getEraIndex(currentEra);
		const foodResource = eraIdx >= 1 ? 'grain' : 'cookedMeat';

		// determine food status
		let status = 'wellFed';
		let efficiency = 1.0;

		if (shouldConsumeFood) {
			const baseConsumption = config.gameVariables?.workerFoodConsumption || 1;
			const requiredFood = workerCount * baseConsumption;
			const availableFood = this.gameState.getResource(foodResource);

			if (availableFood >= requiredFood) {
				this.gameState.addResource(foodResource, -requiredFood);
				status = 'wellFed';
			} else if (availableFood > 0) {
				this.gameState.addResource(foodResource, -availableFood);
				status = 'hungry';
			} else {
				status = 'starving';
			}
		} else {
			// between food cycles, maintain last known status
			status = this.lastFoodStatusByWorker[workerType] || 'wellFed';
		}

		efficiency = this.getWorkerEfficiency(status);
		this.lastFoodStatusByWorker[workerType] = status;

		// check input resource availability (e.g., cooks need meat)
		let workersAbleToWork = workerCount;
		if (workerData.consumes) {
			let maxWorkersByInput = Infinity;
			for (const [resource, perWorkerAmount] of Object.entries(workerData.consumes)) {
				const available = this.gameState.getResource(resource);
				const possible = Math.floor(available / perWorkerAmount);
				maxWorkersByInput = Math.min(maxWorkersByInput, possible);
			}
			workersAbleToWork = Math.max(0, Math.min(workerCount, maxWorkersByInput));

			for (const [resource, perWorkerAmount] of Object.entries(workerData.consumes)) {
				const totalConsume = workersAbleToWork * perWorkerAmount;
				if (totalConsume > 0) this.gameState.addResource(resource, -totalConsume);
			}
		}

		if (workersAbleToWork <= 0 || !workerData.produces) return;

		// compute total production with:
		// - food efficiency
		// - diminishing returns
		// - prestige multiplier
		// - specialization bonuses
		// - grain perk bonus
		// - era-mastery perks (×1.5 per applicable mastery)
		// - chainBonus perk (workers with consumes)
		// - soft cap penalty (yield drops to capPenalty above cap)
		const pm = this.gameManager?.systems?.prestigeManager;
		const prestigeMult = pm?.getMultiplier() || 1;
		const diminishFactor = this.getDiminishingReturnsFactor(workerType);
		const grainMult = pm?.getGrainMultiplier() || 1;
		const chainMult = pm?.getChainBonusMultiplier(workerData) || 1;
		const workerSpecMult = this.gameManager?.getWorkerSpecializationMultiplier(workerType) || 1;

		for (const [resource, basePerWorker] of Object.entries(workerData.produces)) {
			let specMult = this.gameManager?.getSpecializationMultiplier(resource) || 1;
			let resourceMult = 1.0;
			if (resource === 'grain') resourceMult *= grainMult;
			const masteryMult = pm?.getMasteryMultiplier(resource) || 1;
			const capMult = this.getSoftCapMultiplier(resource);

			const total = basePerWorker * workersAbleToWork * efficiency * diminishFactor
				* prestigeMult * workerSpecMult * specMult * resourceMult * masteryMult * chainMult * capMult;
			const prevRemainder = this.productionRemainders[resource] || 0;
			const combined = prevRemainder + total;
			const whole = Math.floor(combined);
			const remainder = combined - whole;

			this.productionRemainders[resource] = remainder;
			if (whole !== 0) {
				this.gameState.addResource(resource, whole);
			}
		}
	}

	/**
	 * Soft cap multiplier for a resource. Returns 1 when below cap, capPenalty
	 * (default 0.25) above cap. Cap scales with pop and workers-in-era.
	 */
	getSoftCapMultiplier(resource) {
		const cfg = config.softCaps;
		if (!cfg?.enabled) return 1.0;

		const eraIdx = config.resourceEra?.[resource];
		if (eraIdx === undefined) return 1.0;

		const baseCap = cfg.base?.[eraIdx];
		if (!baseCap) return 1.0;

		const pop = this.gameState.getResource('population') || 1;
		const popMult = 1 + Math.log10(1 + pop) * (cfg.popFactor || 0);

		// count workers in the era of THIS resource (so resources scale with
		// their own era's labor force)
		let workersInEra = 0;
		const eraKey = config.eraOrder[eraIdx];
		const eraData = config.eraData?.[eraKey];
		if (eraData?.workers) {
			for (const w of eraData.workers) {
				workersInEra += this.gameState.getWorkerCount(w.id) || 0;
			}
		}
		const workerMult = 1 + workersInEra * (cfg.workerFactor || 0);

		const effectiveCap = baseCap * popMult * workerMult;
		const current = this.gameState.getResource(resource) || 0;
		if (current >= effectiveCap) return cfg.capPenalty || 0.25;
		return 1.0;
	}

	getFoodStatus(workerType) {
		return this.lastFoodStatusByWorker[workerType] || 'wellFed';
	}

	startAllWorkerAutomations() {
		const gameData = this.gameState.getState();
		const currentEraData = this.getCurrentEraData();
		if (!currentEraData || !currentEraData.workers) return;

		currentEraData.workers.forEach((workerData) => {
			const workerCount = gameData.workers[workerData.id] || 0;
			if (workerCount > 0) {
				this.startWorkerAutomation(workerData.id, workerData);
			}
		});
	}

	stopAllWorkers() {
		for (const intervalId of this.workerIntervals.values()) {
			clearInterval(intervalId);
		}
		this.workerIntervals.clear();
	}

	restartAllWorkers() {
		const gameData = this.gameState.getState();

		if (!this.gameManager) {
			console.warn('Cannot restart workers: GameManager not available');
			return;
		}

		const currentEraData = this.gameManager.getCurrentEraData();
		if (!currentEraData || !currentEraData.workers) return;

		this.stopAllWorkers();

		Object.entries(gameData.workers).forEach(([workerType, count]) => {
			if (count > 0) {
				const workerData = currentEraData.workers.find((w) => w.id === workerType);
				if (workerData) {
					this.startWorkerAutomation(workerType, workerData);
				}
			}
		});
	}

	getCurrentEraData() {
		if (this.gameManager && this.gameManager.getCurrentEraData) {
			return this.gameManager.getCurrentEraData();
		}
		const gameData = this.gameState.getState();
		const currentEra = gameData.currentEra;
		return config.eraData?.[currentEra] || config.eraData?.paleolithic || null;
	}

	getWorkerEfficiency(foodStatus = 'wellFed') {
		const efficiencyRates = config.balance?.workerEfficiency;
		if (!efficiencyRates) return 1.0;
		return efficiencyRates[foodStatus] || 1.0;
	}

	getWorkerInfo(workerType) {
		if (!this.gameManager) return null;

		const currentEraData = this.gameManager.getCurrentEraData();
		const workerData = currentEraData?.workers?.find((w) => w.id === workerType);
		const gameData = this.gameState.getState();
		const count = gameData.workers[workerType] || 0;

		if (!workerData) return null;

		const diminishPct = Math.round(this.getDiminishingReturnsFactor(workerType) * 100);

		return {
			...workerData,
			count,
			cost: this.calculateWorkerCost(workerData.cost, count),
			canHire: this.gameState.canAfford(
				this.calculateWorkerCost(workerData.cost, count)
			) && this.gameState.getAvailablePopulation() >= 1,
			availablePopulation: this.gameState.getAvailablePopulation(),
			hasAvailablePopulation: this.gameState.getAvailablePopulation() >= 1,
			requirementMet:
				!workerData.requiresUpgrade ||
				gameData.upgrades[workerData.requiresUpgrade],
			efficiencyPct: diminishPct,
			foodStatus: this.getFoodStatus(workerType),
		};
	}

	destroy() {
		this.stopAllWorkers();
	}
}
