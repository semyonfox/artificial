/**
 * Prestige Manager - Handles the prestige (rebirth) loop and talent tree
 *
 * EP formula: floor(sqrt(totalResourceValue / 500) + eraIndex * 8)
 * Multiplier: 1 + EP * 0.1
 * Talent tree: permanent perks bought with EP, persisting across resets
 */

import { config } from '../core/config.js';

const ERA_ORDER = [
	'paleolithic', 'neolithic', 'bronze', 'iron', 'classical',
	'medieval', 'renaissance', 'industrial', 'information',
	'space', 'galactic', 'universal',
];

export class PrestigeManager {
	constructor(gameState) {
		this.gameState = gameState;
	}

	/**
	 * Get or initialize prestige data on the game state
	 */
	getPrestigeData() {
		if (!this.gameState.data.prestige) {
			this.gameState.data.prestige = {
				evolutionPoints: 0,
				lifetimeEP: 0, // total EP ever earned (never decreases)
				totalResets: 0,
				highestEra: 'paleolithic',
				purchasedPerks: [],
			};
		}
		// migrate old saves
		if (!this.gameState.data.prestige.purchasedPerks) {
			this.gameState.data.prestige.purchasedPerks = [];
		}
		if (this.gameState.data.prestige.lifetimeEP === undefined) {
			this.gameState.data.prestige.lifetimeEP = this.gameState.data.prestige.evolutionPoints;
		}
		return this.gameState.data.prestige;
	}

	/**
	 * Calculate how many EP the player would earn if they prestige now
	 */
	calculateEPGain() {
		const data = this.gameState.data;
		const totalValue = Object.entries(data.resources)
			.filter(([key]) => key !== 'population')
			.reduce((sum, [, val]) => sum + Math.max(0, val), 0);

		const eraIdx = ERA_ORDER.indexOf(data.currentEra);
		const eraBonus = Math.max(0, eraIdx) * 8;

		return Math.floor(Math.sqrt(totalValue / 500) + eraBonus);
	}

	/**
	 * Get the global production multiplier from EP
	 * Each EP gives +10% production (1 + EP * 0.1)
	 */
	getMultiplier() {
		const prestige = this.getPrestigeData();
		return 1 + prestige.lifetimeEP * 0.1;
	}

	/**
	 * Can the player prestige? Requires at least neolithic era
	 */
	canPrestige() {
		const eraIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		return eraIdx >= 1;
	}

	/**
	 * Get the highest era skip perk the player has purchased
	 * Returns the era name to start at, or 'paleolithic' if none
	 */
	getStartingEra() {
		const prestige = this.getPrestigeData();
		const perks = prestige.purchasedPerks;

		// check era skips in reverse order (highest first)
		const eraSkipMap = {
			eraSkipGalactic: 'galactic',
			eraSkipSpace: 'space',
			eraSkipInformation: 'information',
			eraSkipIndustrial: 'industrial',
			eraSkipRenaissance: 'renaissance',
			eraSkipMedieval: 'medieval',
			eraSkipClassical: 'classical',
			eraSkipIron: 'iron',
			eraSkipBronze: 'bronze',
		};

		// universal destiny overrides everything
		if (perks.includes('universalDestiny')) {
			return 'information';
		}

		for (const [perkId, era] of Object.entries(eraSkipMap)) {
			if (perks.includes(perkId)) {
				return era;
			}
		}

		return 'paleolithic';
	}

	/**
	 * Check if a perk is available for purchase
	 */
	isPerkAvailable(perkId) {
		const prestige = this.getPrestigeData();
		const perk = config.prestigeTalentTree.find(p => p.id === perkId);
		if (!perk) return false;

		// already purchased
		if (prestige.purchasedPerks.includes(perkId)) return false;

		// not enough EP
		if (prestige.evolutionPoints < perk.cost) return false;

		// check unlock era requirement
		if (perk.unlockEra) {
			const requiredIdx = ERA_ORDER.indexOf(perk.unlockEra);
			const highestIdx = ERA_ORDER.indexOf(prestige.highestEra);
			if (highestIdx < requiredIdx) return false;
		}

		return true;
	}

	/**
	 * Check if a perk is visible (unlock condition met)
	 */
	isPerkVisible(perkId) {
		const prestige = this.getPrestigeData();
		const perk = config.prestigeTalentTree.find(p => p.id === perkId);
		if (!perk) return false;

		if (!perk.unlockEra) return true;

		const requiredIdx = ERA_ORDER.indexOf(perk.unlockEra);
		const highestIdx = ERA_ORDER.indexOf(prestige.highestEra);
		return highestIdx >= requiredIdx;
	}

	/**
	 * Purchase a prestige perk
	 */
	purchasePerk(perkId) {
		if (!this.isPerkAvailable(perkId)) return false;

		const prestige = this.getPrestigeData();
		const perk = config.prestigeTalentTree.find(p => p.id === perkId);

		prestige.evolutionPoints -= perk.cost;
		prestige.purchasedPerks.push(perkId);

		return true;
	}

	/**
	 * Check if player has a specific perk
	 */
	hasPerk(perkId) {
		const prestige = this.getPrestigeData();
		return prestige.purchasedPerks.includes(perkId);
	}

	/**
	 * Get worker interval multiplier from prestige perks
	 * workerEfficiency perk: -15%, timeDilation perk: -30%
	 */
	getWorkerIntervalMultiplier() {
		let mult = 1.0;
		if (this.hasPerk('workerEfficiency')) mult *= 0.85;
		if (this.hasPerk('timeDilation')) mult *= 0.70;
		return mult;
	}

	/**
	 * Get worker cost multiplier from perks
	 * masterCrafter: -25% hiring costs
	 */
	getWorkerCostMultiplier() {
		if (this.hasPerk('masterCrafter')) return 0.75;
		return 1.0;
	}

	/**
	 * Get upgrade cost multiplier from perks
	 * engineeringGenius: -20% upgrade costs
	 */
	getUpgradeCostMultiplier() {
		if (this.hasPerk('engineeringGenius')) return 0.80;
		return 1.0;
	}

	/**
	 * Get population growth multiplier from perks
	 * populationBoom: x3
	 */
	getPopulationGrowthMultiplier() {
		if (this.hasPerk('populationBoom')) return 3.0;
		return 1.0;
	}

	/**
	 * Get grain production multiplier from perks
	 * fertileLands: x2 from Neolithic onward
	 */
	getGrainMultiplier() {
		const eraIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		if (this.hasPerk('fertileLands') && eraIdx >= 1) return 2.0;
		return 1.0;
	}

	/**
	 * Get visible talent tree for UI
	 */
	getTalentTree() {
		const prestige = this.getPrestigeData();
		return config.prestigeTalentTree
			.filter(perk => this.isPerkVisible(perk.id))
			.map(perk => ({
				...perk,
				purchased: prestige.purchasedPerks.includes(perk.id),
				canAfford: prestige.evolutionPoints >= perk.cost,
				available: this.isPerkAvailable(perk.id),
			}));
	}

	/**
	 * Perform prestige reset. Returns the EP gained.
	 */
	prestige() {
		if (!this.canPrestige()) return 0;

		const epGain = this.calculateEPGain();
		const prestige = this.getPrestigeData();

		// award EP
		prestige.evolutionPoints += epGain;
		prestige.lifetimeEP += epGain;
		prestige.totalResets += 1;

		// track highest era
		const currentIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		const highestIdx = ERA_ORDER.indexOf(prestige.highestEra);
		if (currentIdx > highestIdx) {
			prestige.highestEra = this.gameState.data.currentEra;
		}

		// reset game state but preserve prestige and achievements and settings
		const achievements = [...this.gameState.data.progression.achievements];
		const settings = { ...this.gameState.data.settings };
		const prestigeData = { ...prestige, purchasedPerks: [...prestige.purchasedPerks] };

		this.gameState.reset();

		// restore preserved data
		this.gameState.data.prestige = prestigeData;
		this.gameState.data.progression.achievements = achievements;
		this.gameState.data.settings = settings;

		// apply prestige perks to new run
		this.applyPrestigePerks();

		return epGain;
	}

	/**
	 * Apply prestige perks after reset
	 */
	applyPrestigePerks() {
		const prestige = this.getPrestigeData();

		// Quick Start: 10 of each paleolithic resource
		if (this.hasPerk('quickStart')) {
			this.gameState.addResource('sticks', 10);
			this.gameState.addResource('stones', 10);
			this.gameState.addResource('meat', 10);
			this.gameState.addResource('cookedMeat', 10);
			this.gameState.addResource('bones', 10);
			this.gameState.addResource('fur', 10);
		}

		// Ancestral Memory: start at 25% of highest-era pop cap
		if (this.hasPerk('ancestralMemory')) {
			const highestEra = prestige.highestEra;
			const maxPop = config.balance.maxPopulationPerEra[highestEra] || 50;
			const startPop = Math.floor(maxPop * 0.25);
			if (startPop > this.gameState.getResource('population')) {
				this.gameState.data.resources.population = startPop;
			}
		}

		// Era skip - set starting era (handled by GameManager after prestige)
		// firstWorkers - handled by GameManager after prestige (needs worker automation)
	}
}
