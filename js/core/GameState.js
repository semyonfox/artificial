/**
 * GameState - Centralized state management for the Evolution Clicker game
 * Provides a clean interface for state access, validation, and persistence
 */

import { config } from './config.js';

export class GameState {
	constructor() {
		this.data = this.createInitialState();
		this.listeners = new Map();
		this.lastSave = Date.now();

		console.log('GameState initialized');
	}

	/**
	 * Create the initial game state with all necessary properties
	 */
	createInitialState() {
		return {
			// Core game properties
			currentEra: 'paleolithic',
			gameStartTime: Date.now(),
			totalPlayTime: 0,

			// Resources - organized by era for better management
			resources: this.createInitialResources(),

			// Workers - all worker types across eras
			workers: this.createInitialWorkers(),

			// Upgrades - organized by era and status
			upgrades: this.createInitialUpgrades(),

			// Progress tracking
			progression: {
				eraProgress: 0,
				totalResources: 0,
				totalWorkers: 0,
				totalUpgrades: 0,
				achievements: [],
			},

			// Game settings
			settings: {
				autoSave: true,
				notifications: true,
				soundEnabled: true,
				fastMode: false,
			},
		};
	}

	/**
	 * Create initial resource state with all possible resources
	 */
	createInitialResources() {
		const resources = {};

		// Initialize all resources from config to 0, except starting resources
		Object.keys(config.resourceIcons).forEach((resource) => {
			resources[resource] = 0;
		});

		// Set starting resources for paleolithic era
		resources.sticks = 10;
		resources.stones = 5;
		resources.population = 1;

		return resources;
	}

	/**
	 * Create initial worker state
	 */
	createInitialWorkers() {
		const workers = {};

		// Initialize all worker types from config
		Object.keys(config.workerTimers).forEach((workerType) => {
			workers[workerType] = 0;
		});

		return workers;
	}

	/**
	 * Create initial upgrade state
	 */
	createInitialUpgrades() {
		return {
			// Paleolithic upgrades
			fireControl: false,
			stoneKnapping: false,
			furClothing: false,
			boneTools: false,
			shelterBuilding: false,

			// Neolithic upgrades
			agriculture: false,
			pottery: false,
			animalDomestication: false,
			weaving: false,
			settlement: false,

			// Bronze Age upgrades
			bronzeWorking: false,
			writing: false,
			wheel: false,
			urbanPlanning: false,
			mathematics: false,

			// Iron Age upgrades
			ironWorking: false,
			engineering: false,
			philosophy: false,
			coinage: false,
			militaryTactics: false,

			// Industrial Age upgrades
			steamEngine: false,
			railways: false,
			electricity: false,
			massProduction: false,
			telegraphSystem: false,

			// Information Age upgrades
			programming: false,
			internet: false,
			dataAnalysis: false,
			artificialIntelligence: false,
			quantumComputing: false,
		};
	}

	/**
	 * Get a copy of the current state
	 */
	getState() {
		return { ...this.data };
	}

	/**
	 * Get a specific resource value
	 */
	getResource(resourceType) {
		return this.data.resources[resourceType] || 0;
	}

	/**
	 * Add resources with validation
	 */
	addResource(resourceType, amount) {
		if (typeof amount !== 'number' || isNaN(amount)) {
			console.warn(`Invalid amount for resource ${resourceType}:`, amount);
			return false;
		}

		const oldValue = this.data.resources[resourceType] || 0;
		const newValue = Math.max(0, oldValue + amount);
		this.data.resources[resourceType] = newValue;

		// Trigger resource change listeners
		this.notifyListeners('resourceChange', {
			resourceType,
			oldValue,
			newValue,
			amount,
		});

		return true;
	}

	/**
	 * Check if player can afford a cost
	 */
	canAfford(costs) {
		if (!costs || typeof costs !== 'object') return true;

		return Object.entries(costs).every(([resource, amount]) => {
			return this.getResource(resource) >= amount;
		});
	}

	/**
	 * Spend resources if possible
	 */
	spendResources(costs) {
		if (!this.canAfford(costs)) return false;

		Object.entries(costs).forEach(([resource, amount]) => {
			this.addResource(resource, -amount);
		});

		return true;
	}

	/**
	 * Get worker count
	 */
	getWorkerCount(workerType) {
		return this.data.workers[workerType] || 0;
	}

	/**
	 * Add workers
	 */
	addWorker(workerType, count = 1) {
		const oldCount = this.data.workers[workerType] || 0;
		const newCount = oldCount + count;
		this.data.workers[workerType] = Math.max(0, newCount);

		this.notifyListeners('workerChange', {
			workerType,
			oldCount,
			newCount,
			count,
		});
		return true;
	}

	/**
	 * Check if upgrade is unlocked
	 */
	hasUpgrade(upgradeId) {
		return this.data.upgrades[upgradeId] === true;
	}

	/**
	 * Unlock an upgrade
	 */
	unlockUpgrade(upgradeId) {
		if (this.data.upgrades.hasOwnProperty(upgradeId)) {
			const wasUnlocked = this.data.upgrades[upgradeId];
			this.data.upgrades[upgradeId] = true;

			if (!wasUnlocked) {
				this.notifyListeners('upgradeUnlocked', { upgradeId });
			}

			return true;
		}
		return false;
	}

	/**
	 * Get efficiency multiplier for a resource type
	 */
	getEfficiencyMultiplier(resourceType) {
		let multiplier = 1.0;

		// Apply upgrade bonuses
		if (this.data.upgrades.boneTools) {
			multiplier *= 2.0;
		}

		if (this.data.upgrades.efficiency) {
			multiplier *= 1 + this.data.upgrades.efficiency * 0.1;
		}

		// Apply era-specific bonuses from config
		const eraMultipliers = config.efficiencyMultipliers?.[this.data.currentEra];
		if (eraMultipliers && eraMultipliers[resourceType]) {
			multiplier *= eraMultipliers[resourceType];
		}

		return multiplier;
	}

	/**
	 * Get worker food consumption rate
	 */
	getWorkerFoodConsumption() {
		const baseConsumption = config.gameVariables?.workerFoodConsumption || 1;
		const totalWorkers = Object.values(this.data.workers).reduce(
			(sum, count) => sum + count,
			0
		);

		return Math.max(0, totalWorkers * baseConsumption);
	}

	/**
	 * Check if era advancement is possible
	 */
	canAdvanceEra() {
		const requirements = config.balance?.eraProgressionRequirements;
		if (!requirements) return false;

		const population = this.data.resources.population || 0;
		const maxPop =
			config.balance?.maxPopulationPerEra?.[this.data.currentEra] || 100;

		// Check population requirement
		const populationMet =
			population >= maxPop * requirements.populationMultiplier;

		// Check resource diversity (simplified)
		const resourceTypes = Object.keys(this.data.resources).filter(
			(key) => this.data.resources[key] > 0
		);
		const diversityMet = resourceTypes.length >= 5; // At least 5 different resources

		// Check upgrade completion (simplified)
		const completedUpgrades = Object.values(this.data.upgrades).filter(
			Boolean
		).length;
		const upgradesMet = completedUpgrades >= 2; // At least 2 upgrades

		return populationMet && diversityMet && upgradesMet;
	}

	/**
	 * Get total resource value (for progression tracking)
	 */
	getTotalResourceValue() {
		return Object.values(this.data.resources).reduce(
			(sum, amount) => sum + amount,
			0
		);
	}

	/**
	 * Register event listener
	 */
	addListener(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event).push(callback);
	}

	/**
	 * Remove event listener
	 */
	removeListener(event, callback) {
		if (this.listeners.has(event)) {
			const callbacks = this.listeners.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		}
	}

	/**
	 * Remove all event listeners
	 */
	removeAllListeners() {
		this.listeners.clear();
	}

	/**
	 * Notify listeners of state changes
	 */
	notifyListeners(event, data) {
		if (this.listeners.has(event)) {
			this.listeners.get(event).forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(`Error in ${event} listener:`, error);
				}
			});
		}
	}

	/**
	 * Validate game state integrity
	 */
	validate() {
		const errors = [];

		// Validate resources
		Object.entries(this.data.resources).forEach(([resource, value]) => {
			if (typeof value !== 'number' || isNaN(value) || value < 0) {
				errors.push(`Invalid resource value: ${resource} = ${value}`);
				this.data.resources[resource] = 0;
			}
		});

		// Validate workers
		Object.entries(this.data.workers).forEach(([worker, count]) => {
			if (typeof count !== 'number' || isNaN(count) || count < 0) {
				errors.push(`Invalid worker count: ${worker} = ${count}`);
				this.data.workers[worker] = 0;
			}
		});

		if (errors.length > 0) {
			console.warn('Game state validation errors:', errors);
		}

		return errors.length === 0;
	}

	/**
	 * Save game state to localStorage
	 */
	save() {
		try {
			const saveData = {
				...this.data,
				lastSave: Date.now(),
			};

			localStorage.setItem(config.storage.saveKey, JSON.stringify(saveData));
			this.lastSave = Date.now();

			console.log('Game saved successfully');
			return true;
		} catch (error) {
			console.error('Failed to save game:', error);
			return false;
		}
	}

	/**
	 * Load game state from localStorage
	 */
	load() {
		try {
			const saveData = localStorage.getItem(config.storage.saveKey);
			if (!saveData) return false;

			const parsedData = JSON.parse(saveData);

			// Merge saved data with current structure to handle new properties
			this.data = { ...this.createInitialState(), ...parsedData };

			// Validate loaded state
			this.validate();

			console.log('Game loaded successfully');
			this.notifyListeners('gameLoaded', this.data);

			return true;
		} catch (error) {
			console.error('Failed to load game:', error);
			return false;
		}
	}

	/**
	 * Reset game state to initial values
	 */
	reset() {
		this.data = this.createInitialState();
		this.notifyListeners('gameReset', this.data);
		console.log('Game state reset');
	}

	/**
	 * Get game statistics
	 */
	getStatistics() {
		const totalResources = Object.values(this.data.resources).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalWorkers = Object.values(this.data.workers).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalUpgrades = Object.values(this.data.upgrades).filter(
			Boolean
		).length;

		return {
			totalResources,
			totalWorkers,
			totalUpgrades,
			currentEra: this.data.currentEra,
			playTime: this.data.totalPlayTime,
		};
	}
}
