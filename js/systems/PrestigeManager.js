/**
 * Prestige Manager - Handles the prestige (rebirth) loop
 *
 * When a player prestiges, they lose all resources, workers, and upgrades
 * but gain "evolution points" (EP) based on their progress. EP provide
 * permanent multipliers that persist across resets.
 *
 * EP formula: floor(sqrt(totalResourceValue / 1000) + eraBonus)
 * where eraBonus = eraIndex * 5
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
				totalResets: 0,
				highestEra: 'paleolithic',
			};
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
		const eraBonus = Math.max(0, eraIdx) * 5;

		return Math.floor(Math.sqrt(totalValue / 1000) + eraBonus);
	}

	/**
	 * Get the global production multiplier from EP
	 * Each EP gives +2% production
	 */
	getMultiplier() {
		const prestige = this.getPrestigeData();
		return 1 + prestige.evolutionPoints * 0.02;
	}

	/**
	 * Can the player prestige? Requires at least neolithic era
	 */
	canPrestige() {
		const eraIdx = ERA_ORDER.indexOf(this.gameState.data.currentEra);
		return eraIdx >= 1;
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
		const prestigeData = { ...prestige };

		this.gameState.reset();

		// restore preserved data
		this.gameState.data.prestige = prestigeData;
		this.gameState.data.progression.achievements = achievements;
		this.gameState.data.settings = settings;

		return epGain;
	}
}
