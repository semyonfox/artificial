/**
 * Offline Manager - calculates resource production while the player was away.
 *
 * Tiered rates (default; offlineMaster perk extends them):
 *   0 → fullHours:        full rate
 *   fullHours → reducedHours: reducedRate (default 0.5)
 *   beyond reducedHours:  capped (no more accrual past reducedHours)
 *
 * Click actions never run offline; only workers and population growth do.
 */

import { config } from '../core/config.js';

const ERA_ORDER = config.eraOrder;

export class OfflineManager {
	constructor(gameState) {
		this.gameState = gameState;
		window.addEventListener('beforeunload', () => {
			localStorage.setItem('lastActive', Date.now().toString());
		});
	}

	/**
	 * Compute effective offline seconds based on tier configuration.
	 * Returns { fullSec, reducedSec } — the duration in each tier (so we can
	 * apply different production rates).
	 */
	splitOfflineDuration(offlineMs, offlineCfg) {
		const fullSec = Math.min(offlineMs, offlineCfg.fullHours * 3600 * 1000);
		const remainder = Math.max(0, offlineMs - fullSec);
		const reducedSec = Math.min(remainder, (offlineCfg.reducedHours - offlineCfg.fullHours) * 3600 * 1000);
		return {
			fullSec: fullSec / 1000,
			reducedSec: reducedSec / 1000,
		};
	}

	/**
	 * Apply offline production. Returns summary or null if nothing happened.
	 */
	applyOfflineProduction(gameManager) {
		const lastActive = localStorage.getItem('lastActive');
		if (!lastActive) {
			localStorage.setItem('lastActive', Date.now().toString());
			return null;
		}

		const offlineMs = Date.now() - parseInt(lastActive);
		localStorage.setItem('lastActive', Date.now().toString());
		if (offlineMs < 60000) return null; // ignore <1 minute

		const pm = gameManager.systems?.prestigeManager;
		const offlineCfg = pm?.getOfflineConfig() || { fullHours: 8, reducedHours: 24, reducedRate: 0.5, rateMult: 1.0 };

		const { fullSec, reducedSec } = this.splitOfflineDuration(offlineMs, offlineCfg);
		const totalEffectiveSec = fullSec + reducedSec * offlineCfg.reducedRate;
		if (totalEffectiveSec <= 0) return null;

		const eraData = gameManager.getCurrentEraData();
		if (!eraData?.workers) {
			return { offlineMinutes: Math.floor(offlineMs / 60000), produced: {} };
		}

		const gameData = this.gameState.getState();
		const produced = {};

		const prestigeMult = pm?.getMultiplier() || 1;
		const rateMult = offlineCfg.rateMult || 1.0;

		eraData.workers.forEach((workerData) => {
			const count = gameData.workers[workerData.id] || 0;
			if (count <= 0 || !workerData.produces) return;

			const wm = gameManager.systems?.workerManager;
			const interval = wm?.getEffectiveInterval(workerData) || workerData.interval || 10000;
			const cyclesPerSec = 1000 / interval;
			let totalCycles = totalEffectiveSec * cyclesPerSec;

			// Chain workers must have their inputs just as they do while online.
			// Cap the simulated cycles before producing anything; the old flow
			// produced a full offline haul first and only then consumed whatever
			// inputs happened to be available, allowing output from nothing.
			if (workerData.consumes) {
				for (const [resource, perWorkerCycle] of Object.entries(workerData.consumes)) {
					const available = this.gameState.getResource(resource);
					const requiredPerCycle = perWorkerCycle * count;
					if (requiredPerCycle > 0) {
						totalCycles = Math.min(totalCycles, available / requiredPerCycle);
					}
				}
			}
			if (totalCycles <= 0) return;

			const workerSpecMult = gameManager?.getWorkerSpecializationMultiplier(workerData.id) || 1;
			const diminishMult = wm?.getDiminishingReturnsFactor(workerData.id) || 1;
			const chainMult = pm?.getChainBonusMultiplier(workerData) || 1;
			Object.entries(workerData.produces).forEach(([resource, basePerWorker]) => {
				const masteryMult = pm?.getMasteryMultiplier(resource) || 1;
				const specializationMult = gameManager?.getSpecializationMultiplier(resource) || 1;
				const grainMult = resource === 'grain' ? (pm?.getGrainMultiplier() || 1) : 1;
				const capMult = wm?.getSoftCapMultiplier(resource) ?? 1;
				const amount = Math.floor(
					basePerWorker * count * totalCycles * prestigeMult * workerSpecMult
						* diminishMult * specializationMult * masteryMult * grainMult
						* chainMult * capMult * rateMult,
				);
				if (amount > 0) {
					const before = this.gameState.getResource(resource);
					this.gameState.addResource(resource, amount);
					const actual = this.gameState.getResource(resource) - before;
					if (actual > 0) {
						produced[resource] = (produced[resource] || 0) + actual;
					}
				}
			});

			// Consume exactly the inputs for the cycles that were actually possible.
			if (workerData.consumes) {
				for (const [resource, perCycle] of Object.entries(workerData.consumes)) {
					const total = perCycle * count * totalCycles;
					if (total > 0) {
						this.gameState.addResource(resource, -total);
					}
				}
			}
		});

		// population growth while offline (up to cap)
		this.applyOfflinePopulation(gameManager, totalEffectiveSec);

		if (Object.keys(produced).length === 0) return { offlineMinutes: Math.floor(offlineMs / 60000), produced: {} };

		return {
			offlineMinutes: Math.floor(offlineMs / 60000),
			produced,
		};
	}

	/**
	 * Grow population over the offline duration, clamped to era cap.
	 */
	applyOfflinePopulation(gameManager, seconds) {
		const data = this.gameState.data;
		const currentEra = data.currentEra;
		const eraIdx = ERA_ORDER.indexOf(currentEra);
		const maxPop = gameManager.getPopulationCapacity?.(currentEra)
			|| config.balance?.maxPopulationPerEra?.[currentEra]
			|| 50;
		const currentPop = this.gameState.getResource('population');
		if (currentPop <= 0) {
			this.gameState.addResource('population', 1);
			return;
		}
		if (currentPop >= maxPop) return;

		const growthCfg = config.balance.populationGrowth;
		const baseRate = growthCfg.baseRate || 0.025;
		const perCapitaRate = growthCfg.perCapitaRate || 0.003;
		const eraScaling = growthCfg.eraScaling || 0.18;
		const perSec = (baseRate + currentPop * perCapitaRate) * (1 + eraIdx * eraScaling);

		let mult = 1.0;
		if (this.gameState.hasUpgrade('clothing')) mult *= growthCfg.clothingBonus;
		if (this.gameState.hasUpgrade('shelterBuilding')) mult *= growthCfg.shelterBonus;
		if (this.gameState.hasUpgrade('civilEngineering') && eraIdx >= 4) mult *= growthCfg.aqueductBonus;
		if (this.gameState.hasUpgrade('classicalMedicine') && eraIdx >= 4) mult *= growthCfg.medicineBonus;
		const pm = gameManager.systems?.prestigeManager;
		if (pm) mult *= pm.getPopulationGrowthMultiplier();

		const capacityPressure = Math.max(0, 1 - currentPop / maxPop);
		const foodFactor = gameManager.getPopulationFoodFactor?.(currentPop, eraIdx) ?? 1;
		const workerLoadFactor = gameManager.getPopulationWorkerLoadFactor?.(currentPop) ?? 1;
		const growth = perSec * capacityPressure * foodFactor * workerLoadFactor * mult * seconds;
		const newPop = Math.min(currentPop + growth, maxPop);
		const actualGrowth = newPop - currentPop;
		if (actualGrowth > 0) this.gameState.addResource('population', actualGrowth);
	}
}
