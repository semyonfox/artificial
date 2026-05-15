/**
 * Prestige Manager - handles the prestige loop, talent tree, and mastery perks.
 *
 * EP formula (new): points = Σ lifetimeProduced[r] × eraMultBase^era(r)
 *                   EP = floor(log10(1 + points / SCALE))
 * Multiplier:       1 + sqrt(lifetimeEP) × multBase   (sqrt; sigmoid-ish)
 *
 * Era skip perks are gone. Mastery perks reward completing an era.
 * Deep production perks unlock at high lifetime EP for endgame.
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
	 * Get or initialize prestige data on the game state.
	 * Migrates older shapes (purchasedPerks, lifetimeEP, completedEras).
	 */
	getPrestigeData() {
		if (!this.gameState.data.prestige) {
			this.gameState.data.prestige = {
				evolutionPoints: 0,
				lifetimeEP: 0,
				totalResets: 0,
				highestEra: 'paleolithic',
				purchasedPerks: [],
				completedEras: [],
			};
		}
		const p = this.gameState.data.prestige;
		if (!p.purchasedPerks) p.purchasedPerks = [];
		if (p.lifetimeEP === undefined) p.lifetimeEP = p.evolutionPoints || 0;
		if (!p.completedEras) p.completedEras = [];

		// strip any obsolete era-skip perks from old saves. refund their cost.
		const obsolete = p.purchasedPerks.filter((id) => id.startsWith('eraSkip') || id === 'universalDestiny');
		if (obsolete.length > 0) {
			let refund = 0;
			obsolete.forEach((id) => {
				refund += id === 'universalDestiny' ? 200 : 75;
			});
			p.purchasedPerks = p.purchasedPerks.filter((id) => !obsolete.includes(id));
			p.evolutionPoints += refund;
			if (typeof console !== 'undefined') {
				console.info(`[prestige] removed ${obsolete.length} obsolete era-skip perks, refunded ${refund} EP`);
			}
		}
		return p;
	}

	/**
	 * Resource → era index. Uses config.resourceEra map, defaults to 0.
	 */
	getResourceEraIndex(resource) {
		return config.resourceEra?.[resource] ?? 0;
	}

	/**
	 * Calculate how many EP the player would earn if they prestige now.
	 * Based on lifetime production, weighted by resource era tier.
	 *
	 * EP = floor(log10(1+points)^2 × coefficient)
	 * Squared log: meaningful growth across many orders of magnitude,
	 * never runs away.
	 */
	calculateEPGain() {
		const lifetime = this.gameState.data.lifetimeProduced || {};
		const scaling = config.prestigeScaling || { eraMultBase: 3, coefficient: 0.7 };
		const base = scaling.eraMultBase || 3;
		const coef = scaling.coefficient || 0.7;

		let points = 0;
		for (const [resource, amount] of Object.entries(lifetime)) {
			if (!amount || amount <= 0) continue;
			const era = this.getResourceEraIndex(resource);
			points += amount * Math.pow(base, era);
		}

		if (points <= 0) return 0;
		const logged = Math.log10(1 + points);
		return Math.floor(logged * logged * coef);
	}

	/**
	 * Global production multiplier from accumulated prestige.
	 * mult = 1 + sqrt(lifetimeEP) × multBase
	 * If compoundGrowth perk owned, multBase is steeper.
	 */
	getMultiplier() {
		const prestige = this.getPrestigeData();
		const scaling = config.prestigeScaling || { multBase: 0.3 };
		let multBase = scaling.multBase || 0.3;
		if (this.hasPerk('compoundGrowth')) multBase = 0.4;
		return 1 + Math.sqrt(Math.max(0, prestige.lifetimeEP)) * multBase;
	}

	/**
	 * Prestige is allowed once player has reached at least Neolithic.
	 */
	canPrestige() {
		const eraIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		return eraIdx >= 1;
	}

	/**
	 * No era-skip perks any more; every run begins at Paleolithic.
	 */
	getStartingEra() {
		return 'paleolithic';
	}

	/**
	 * Is a perk visible (unlock condition met)?
	 */
	isPerkVisible(perkId) {
		const perk = config.prestigeTalentTree.find((p) => p.id === perkId);
		if (!perk) return false;
		const prestige = this.getPrestigeData();

		// era-completion-gated (mastery perks)
		if (perk.requiresCompletedEra) {
			return prestige.completedEras.includes(perk.requiresCompletedEra);
		}
		// lifetime-EP-gated (deep production perks)
		if (perk.requiresLifetimeEP) {
			return prestige.lifetimeEP >= perk.requiresLifetimeEP;
		}
		// era-reached-gated (older perks)
		if (perk.unlockEra) {
			const required = ERA_ORDER.indexOf(perk.unlockEra);
			const highest = ERA_ORDER.indexOf(prestige.highestEra);
			return highest >= required;
		}
		return true;
	}

	/**
	 * Can the player purchase this perk right now?
	 */
	isPerkAvailable(perkId) {
		const perk = config.prestigeTalentTree.find((p) => p.id === perkId);
		if (!perk) return false;
		const prestige = this.getPrestigeData();
		if (prestige.purchasedPerks.includes(perkId)) return false;
		if (prestige.evolutionPoints < perk.cost) return false;
		return this.isPerkVisible(perkId);
	}

	/**
	 * Attempt to buy a perk. Returns success.
	 */
	purchasePerk(perkId) {
		if (!this.isPerkAvailable(perkId)) return false;
		const perk = config.prestigeTalentTree.find((p) => p.id === perkId);
		const prestige = this.getPrestigeData();
		prestige.evolutionPoints -= perk.cost;
		prestige.purchasedPerks.push(perkId);
		return true;
	}

	hasPerk(perkId) {
		return this.getPrestigeData().purchasedPerks.includes(perkId);
	}

	/**
	 * Worker interval multiplier from perks (lower = faster).
	 */
	getWorkerIntervalMultiplier() {
		let mult = 1.0;
		if (this.hasPerk('workerEfficiency')) mult *= 0.85;
		if (this.hasPerk('timeDilation')) mult *= 0.70;
		return mult;
	}

	getWorkerCostMultiplier() {
		return this.hasPerk('masterCrafter') ? 0.75 : 1.0;
	}

	getUpgradeCostMultiplier() {
		return this.hasPerk('engineeringGenius') ? 0.80 : 1.0;
	}

	getPopulationGrowthMultiplier() {
		return this.hasPerk('populationBoom') ? 3.0 : 1.0;
	}

	getGrainMultiplier() {
		const eraIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		return this.hasPerk('fertileLands') && eraIdx >= 1 ? 2.0 : 1.0;
	}

	/**
	 * Combined mastery multiplier for a given resource across all owned
	 * era-mastery perks. Each owned mastery gives ×1.5 to its resources.
	 */
	getMasteryMultiplier(resource) {
		const masteryMap = config.eraMasteryResources || {};
		let mult = 1.0;
		for (const [perkId, resources] of Object.entries(masteryMap)) {
			if (!this.hasPerk(perkId)) continue;
			if (resources.includes(resource)) mult *= 1.5;
		}
		return mult;
	}

	/**
	 * If chainBonus perk owned and worker has consumes inputs, return 1.5.
	 */
	getChainBonusMultiplier(workerData) {
		if (!this.hasPerk('chainBonus')) return 1.0;
		if (workerData?.consumes && Object.keys(workerData.consumes).length > 0) return 1.5;
		return 1.0;
	}

	/**
	 * Offline progress configuration. Default + offlineMaster perk override.
	 */
	getOfflineConfig() {
		if (this.hasPerk('offlineMaster')) {
			return { fullHours: 16, reducedHours: 48, reducedRate: 0.75, rateMult: 1.5 };
		}
		return { fullHours: 8, reducedHours: 24, reducedRate: 0.5, rateMult: 1.0 };
	}

	/**
	 * Build talent tree view for UI. Filters to visible perks, annotates state.
	 */
	getTalentTree() {
		const prestige = this.getPrestigeData();
		return config.prestigeTalentTree
			.filter((perk) => this.isPerkVisible(perk.id))
			.map((perk) => ({
				...perk,
				purchased: prestige.purchasedPerks.includes(perk.id),
				canAfford: prestige.evolutionPoints >= perk.cost,
				available: this.isPerkAvailable(perk.id),
			}));
	}

	/**
	 * Perform prestige. Returns EP gained.
	 */
	prestige() {
		if (!this.canPrestige()) return 0;
		const epGain = this.calculateEPGain();
		const prestige = this.getPrestigeData();

		prestige.evolutionPoints += epGain;
		prestige.lifetimeEP += epGain;
		prestige.totalResets += 1;

		// track highest era reached + completed eras (anything past paleolithic
		// at the moment of prestige counts as "completed", and so do all eras
		// strictly before the current one).
		const currentIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		const highestIdx = ERA_ORDER.indexOf(prestige.highestEra);
		if (currentIdx > highestIdx) prestige.highestEra = this.gameState.data.currentEra;
		for (let i = 0; i < currentIdx; i++) {
			if (!prestige.completedEras.includes(ERA_ORDER[i])) {
				prestige.completedEras.push(ERA_ORDER[i]);
			}
		}

		// preserve carry-over data before reset
		const achievements = [...this.gameState.data.progression.achievements];
		const settings = { ...this.gameState.data.settings };
		const prestigeData = { ...prestige, purchasedPerks: [...prestige.purchasedPerks], completedEras: [...prestige.completedEras] };

		this.gameState.reset();

		// restore carry-over
		this.gameState.data.prestige = prestigeData;
		this.gameState.data.progression.achievements = achievements;
		this.gameState.data.settings = settings;

		this.applyPrestigePerks();
		return epGain;
	}

	/**
	 * Apply perk effects that take action at the start of a new run.
	 */
	applyPrestigePerks() {
		const prestige = this.getPrestigeData();
		if (this.hasPerk('quickStart')) {
			this.gameState.addResource('sticks', 10);
			this.gameState.addResource('stones', 10);
			this.gameState.addResource('meat', 10);
			this.gameState.addResource('cookedMeat', 10);
			this.gameState.addResource('bones', 10);
			this.gameState.addResource('fur', 10);
		}
		if (this.hasPerk('ancestralMemory')) {
			const highestEra = prestige.highestEra;
			const maxPop = config.balance.maxPopulationPerEra[highestEra] || 50;
			const startPop = Math.floor(maxPop * 0.25);
			if (startPop > this.gameState.getResource('population')) {
				this.gameState.data.resources.population = startPop;
			}
		}
		// firstWorkers handled by GameManager (needs automation hooks)
	}
}
