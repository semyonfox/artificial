/**
 * Game State Management
 * Handles all persistent game data and state transitions
 */

export class GameState {
	constructor() {
		this.initializeDefaultState();
		this.loadFromStorage();
	}

	initializeDefaultState() {
		this.data = {
			currentEra: 'paleolithic',
			version: '1.0.0',

			resources: {
				sticks: 0,
				stones: 0,
				rawMeat: 0,
				meat: 0,
				cookedMeat: 0,
				clothes: 0,
				bones: 0,
				hide: 0,
				fur: 0,
			},

			workers: {
				forager: 0,
				hunter: 0,
				cook: 0,
				woodcutter: 0,
				miner: 0,
			},

			upgrades: {
				fireControl: false,
				boneTools: false,
				stickEfficiency: 0,
				stoneEfficiency: 0,
				cookEfficiency: 1,
				efficiency: 0,
			},

			progression: {
				eraProgress: 0,
				totalClicks: 0,
				totalResources: 0,
			},

			equippedClothes: {
				hunter: [],
				forager: [],
				cook: [],
			},

			unlockedUpgrades: [],
			lastUpdate: Date.now(),

			// Game flags
			flags: {
				tutorialCompleted: false,
				firstWorkerHired: false,
				firstUpgradeBought: false,
			},
		};
	}

	// Get current state data
	getState() {
		return this.data;
	}

	// Update a specific part of the state
	updateState(path, value) {
		const keys = path.split('.');
		let current = this.data;

		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}

		current[keys[keys.length - 1]] = value;
		this.saveToStorage();
	}

	// Get a specific value from state
	getValue(path) {
		const keys = path.split('.');
		let current = this.data;

		for (const key of keys) {
			if (current[key] === undefined) {
				return undefined;
			}
			current = current[key];
		}

		return current;
	}

	// Add to a resource
	addResource(resource, amount) {
		this.data.resources[resource] =
			(this.data.resources[resource] || 0) + amount;
		this.data.progression.totalResources += amount;
		this.saveToStorage();
	}

	// Spend resources
	spendResources(costs) {
		// Check if we can afford it first
		for (const [resource, amount] of Object.entries(costs)) {
			if ((this.data.resources[resource] || 0) < amount) {
				return false;
			}
		}

		// Spend the resources
		for (const [resource, amount] of Object.entries(costs)) {
			this.data.resources[resource] -= amount;
		}

		this.saveToStorage();
		return true;
	}

	// Check if we can afford something
	canAfford(costs) {
		return Object.entries(costs).every(
			([resource, amount]) => (this.data.resources[resource] || 0) >= amount
		);
	}

	// Add a worker
	addWorker(workerType, count = 1) {
		this.data.workers[workerType] =
			(this.data.workers[workerType] || 0) + count;

		if (!this.data.flags.firstWorkerHired) {
			this.data.flags.firstWorkerHired = true;
		}

		this.saveToStorage();
	}

	// Buy an upgrade
	buyUpgrade(upgradeId) {
		if (!this.data.unlockedUpgrades.includes(upgradeId)) {
			this.data.unlockedUpgrades.push(upgradeId);
			this.data.upgrades[upgradeId] = true;

			if (!this.data.flags.firstUpgradeBought) {
				this.data.flags.firstUpgradeBought = true;
			}

			this.saveToStorage();
			return true;
		}
		return false;
	}

	// Save to localStorage
	saveToStorage() {
		try {
			this.data.lastUpdate = Date.now();
			localStorage.setItem('evolutionClickerSave', JSON.stringify(this.data));
		} catch (error) {
			console.warn('Could not save game state:', error);
		}
	}

	// Load from localStorage
	loadFromStorage() {
		try {
			const saved = localStorage.getItem('evolutionClickerSave');
			if (saved) {
				const parsedData = JSON.parse(saved);

				// Merge with default state to handle version upgrades
				this.data = { ...this.data, ...parsedData };

				// Ensure all required properties exist
				this.ensureStateIntegrity();
			}
		} catch (error) {
			console.warn('Could not load game state:', error);
			this.initializeDefaultState();
		}
	}

	// Ensure all required state properties exist
	ensureStateIntegrity() {
		const defaultState = {};
		this.initializeDefaultState.call({ data: defaultState });

		// Recursively merge to ensure all properties exist
		this.data = this.deepMerge(defaultState.data, this.data);
	}

	// Deep merge utility
	deepMerge(target, source) {
		const result = { ...target };

		for (const key in source) {
			if (
				source[key] &&
				typeof source[key] === 'object' &&
				!Array.isArray(source[key])
			) {
				result[key] = this.deepMerge(target[key] || {}, source[key]);
			} else {
				result[key] = source[key];
			}
		}

		return result;
	}

	// Reset the game
	reset() {
		localStorage.removeItem('evolutionClickerSave');
		this.initializeDefaultState();
	}

	// Export save data
	exportSave() {
		return btoa(JSON.stringify(this.data));
	}

	// Import save data
	importSave(saveString) {
		try {
			const data = JSON.parse(atob(saveString));
			this.data = data;
			this.ensureStateIntegrity();
			this.saveToStorage();
			return true;
		} catch (error) {
			console.error('Invalid save data:', error);
			return false;
		}
	}
}

// Legacy export for backward compatibility
export const gameState = new GameState().getState();
