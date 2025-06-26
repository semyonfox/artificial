/**
 * Era Registry - Manages era data and transitions
 * Central system for handling different historical periods
 */

import { paleolithicEra } from './eras/paleolithic.js';
import { mesolithicEra } from './eras/mesolithic.js';

export class EraRegistry {
	constructor() {
		this.eras = new Map();
		this.eraOrder = [];
		this.currentEra = 'paleolithic';

		this.initializeEras();
	}

	/**
	 * Initialize all eras and their order
	 */
	initializeEras() {
		// Register eras
		this.registerEra(paleolithicEra);
		this.registerEra(mesolithicEra);

		// Set era progression order
		this.eraOrder = ['paleolithic', 'mesolithic'];

		console.log('Era Registry initialized with', this.eras.size, 'eras');
	}

	/**
	 * Register a new era
	 */
	registerEra(eraData) {
		if (!eraData.id) {
			throw new Error('Era data must have an id');
		}

		this.eras.set(eraData.id, eraData);
	}

	/**
	 * Get era data by ID
	 */
	getEraData(eraId) {
		return this.eras.get(eraId) || null;
	}

	/**
	 * Get current era data
	 */
	getCurrentEraData() {
		return this.getEraData(this.currentEra);
	}

	/**
	 * Set current era
	 */
	setCurrentEra(eraId) {
		if (this.eras.has(eraId)) {
			this.currentEra = eraId;
			return true;
		}
		return false;
	}

	/**
	 * Get next era in progression
	 */
	getNextEra() {
		const currentIndex = this.eraOrder.indexOf(this.currentEra);
		if (currentIndex >= 0 && currentIndex < this.eraOrder.length - 1) {
			return this.eraOrder[currentIndex + 1];
		}
		return null;
	}

	/**
	 * Check if player can advance to next era
	 */
	canAdvanceEra(gameState) {
		const currentEraData = this.getCurrentEraData();
		const nextEraId = this.getNextEra();

		if (!nextEraId || !currentEraData.progressionRequirements) {
			return false;
		}

		const requirements = currentEraData.progressionRequirements;

		// Check resource requirements
		if (requirements.resources) {
			for (const [resource, amount] of Object.entries(requirements.resources)) {
				if ((gameState.resources[resource] || 0) < amount) {
					return false;
				}
			}
		}

		// Check worker requirements
		if (requirements.workers) {
			if (requirements.workers.total) {
				const totalWorkers = Object.values(gameState.workers).reduce(
					(sum, count) => sum + count,
					0
				);
				if (totalWorkers < requirements.workers.total) {
					return false;
				}
			}

			if (requirements.workers.types) {
				const workerTypes = Object.values(gameState.workers).filter(
					(count) => count > 0
				).length;
				if (workerTypes < requirements.workers.types) {
					return false;
				}
			}
		}

		// Check upgrade requirements
		if (requirements.upgrades) {
			for (const upgradeId of requirements.upgrades) {
				if (!gameState.unlockedUpgrades.includes(upgradeId)) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Advance to next era
	 */
	advanceEra(gameState) {
		const nextEraId = this.getNextEra();

		if (!nextEraId) {
			return false;
		}

		if (!this.canAdvanceEra(gameState)) {
			return false;
		}

		this.currentEra = nextEraId;
		return true;
	}

	/**
	 * Get all available actions for current era
	 */
	getAvailableActions(gameState) {
		const eraData = this.getCurrentEraData();
		if (!eraData || !eraData.actions) {
			return [];
		}

		return eraData.actions.filter((action) => {
			if (!action.requirements) return true;

			// Check upgrade requirements
			if (action.requirements.upgrades) {
				return action.requirements.upgrades.every((upgradeId) =>
					gameState.unlockedUpgrades.includes(upgradeId)
				);
			}

			return true;
		});
	}

	/**
	 * Get all available workers for current era
	 */
	getAvailableWorkers() {
		const eraData = this.getCurrentEraData();
		return eraData?.workers || [];
	}

	/**
	 * Get all available upgrades for current era
	 */
	getAvailableUpgrades() {
		const eraData = this.getCurrentEraData();
		return eraData?.upgrades || [];
	}

	/**
	 * Get era progression info
	 */
	getProgressionInfo(gameState) {
		const currentEraData = this.getCurrentEraData();
		const nextEraId = this.getNextEra();

		if (!nextEraId || !currentEraData.progressionRequirements) {
			return null;
		}

		const requirements = currentEraData.progressionRequirements;
		const progress = {};

		// Calculate resource progress
		if (requirements.resources) {
			progress.resources = {};
			for (const [resource, required] of Object.entries(
				requirements.resources
			)) {
				const current = gameState.resources[resource] || 0;
				progress.resources[resource] = {
					current,
					required,
					percentage: Math.min(100, (current / required) * 100),
				};
			}
		}

		// Calculate worker progress
		if (requirements.workers) {
			progress.workers = {};

			if (requirements.workers.total) {
				const totalWorkers = Object.values(gameState.workers).reduce(
					(sum, count) => sum + count,
					0
				);
				progress.workers.total = {
					current: totalWorkers,
					required: requirements.workers.total,
					percentage: Math.min(
						100,
						(totalWorkers / requirements.workers.total) * 100
					),
				};
			}

			if (requirements.workers.types) {
				const workerTypes = Object.values(gameState.workers).filter(
					(count) => count > 0
				).length;
				progress.workers.types = {
					current: workerTypes,
					required: requirements.workers.types,
					percentage: Math.min(
						100,
						(workerTypes / requirements.workers.types) * 100
					),
				};
			}
		}

		// Calculate upgrade progress
		if (requirements.upgrades) {
			progress.upgrades = {};
			const completed = requirements.upgrades.filter((upgradeId) =>
				gameState.unlockedUpgrades.includes(upgradeId)
			).length;

			progress.upgrades = {
				current: completed,
				required: requirements.upgrades.length,
				percentage: Math.min(
					100,
					(completed / requirements.upgrades.length) * 100
				),
				missing: requirements.upgrades.filter(
					(upgradeId) => !gameState.unlockedUpgrades.includes(upgradeId)
				),
			};
		}

		return {
			nextEra: nextEraId,
			nextEraData: this.getEraData(nextEraId),
			canAdvance: this.canAdvanceEra(gameState),
			progress,
		};
	}

	/**
	 * Get all eras
	 */
	getAllEras() {
		return Array.from(this.eras.values());
	}

	/**
	 * Get era by index in progression order
	 */
	getEraByIndex(index) {
		const eraId = this.eraOrder[index];
		return eraId ? this.getEraData(eraId) : null;
	}
}

// Export the registry data for backward compatibility
export const eraRegistry = {
	paleolithic: {
		name: 'Paleolithic Era',
		path: './eras/paleolithic.js',
		order: 1,
		unlockConditions: {}, // Starting era
	},
	mesolithic: {
		name: 'Mesolithic Era',
		path: './eras/mesolithic.js',
		order: 2,
		unlockConditions: {
			requiredEra: 'paleolithic',
			requiredResources: { clothes: 5 },
		},
	},
	// TODO... other eras
};
