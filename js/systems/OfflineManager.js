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

const ERA_ORDER = [
	'paleolithic', 'neolithic', 'bronze', 'iron', 'classical',
	'medieval', 'renaissance', 'industrial', 'information',
	'space', 'galactic', 'universal',
];

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

			const interval = workerData.interval || 10000;
			const cyclesPerSec = 1000 / interval;
			const totalCycles = totalEffectiveSec * cyclesPerSec;
			if (totalCycles <= 0) return;

			const masteryMap = {};
			Object.entries(workerData.produces).forEach(([resource, basePerWorker]) => {
				const masteryMult = pm?.getMasteryMultiplier(resource) || 1;
				const amount = Math.floor(
					basePerWorker * count * totalCycles * prestigeMult * masteryMult * rateMult,
				);
				if (amount > 0) {
					this.gameState.addResource(resource, amount);
					produced[resource] = (produced[resource] || 0) + amount;
					masteryMap[resource] = true;
				}
			});

			// best-effort consume on offline production (chain workers eat their inputs)
			if (workerData.consumes) {
				for (const [resource, perCycle] of Object.entries(workerData.consumes)) {
					const total = Math.floor(perCycle * count * totalCycles * rateMult);
					if (total > 0) {
						const avail = this.gameState.getResource(resource);
						this.gameState.addResource(resource, -Math.min(avail, total));
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
		const maxPop = config.balance?.maxPopulationPerEra?.[currentEra] || 50;
		const currentPop = this.gameState.getResource('population');
		if (currentPop >= maxPop) return;

		const baseRate = config.balance.populationGrowth.baseRate;
		const eraScaling = config.balance.populationGrowth.eraScaling;
		let perSec = baseRate * (1 + eraIdx * eraScaling);

		let mult = 1.0;
		if (this.gameState.hasUpgrade('clothing')) mult *= config.balance.populationGrowth.clothingBonus;
		if (this.gameState.hasUpgrade('shelterBuilding')) mult *= config.balance.populationGrowth.shelterBonus;
		if (this.gameState.hasUpgrade('civilEngineering') && eraIdx >= 4) mult *= config.balance.populationGrowth.aqueductBonus;
		if (this.gameState.hasUpgrade('classicalMedicine') && eraIdx >= 4) mult *= config.balance.populationGrowth.medicineBonus;
		const pm = gameManager.systems?.prestigeManager;
		if (pm) mult *= pm.getPopulationGrowthMultiplier();

		const growth = perSec * mult * seconds;
		const newPop = Math.min(currentPop + growth, maxPop);
		const actualGrowth = newPop - currentPop;
		if (actualGrowth > 0) this.gameState.addResource('population', actualGrowth);
	}
}
