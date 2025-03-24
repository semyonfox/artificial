import { config } from './config.js';
import { ResourceManager } from './ResourceManager.js';
import { UIManager } from './UIManager.js';
import { WorkerManager } from './WorkerManager.js';
import { gameProgressionData } from './gamedata.js';

/**
 * Manages the overall game state, progression, and interactions.
 * Handles resources, workers, upgrades, events, disasters, and era transitions.
 */
export class GameManager {
	constructor() {
		// Initialize the game state
		this.state = {
			resources: {
				sticks: 0,
				stones: 0,
				meat: 0,
				cookedMeat: 0,
				bones: 0,
				fur: 0,
			},
			upgrades: {},
			age: 'prehistoric', // Make sure this matches an era in gameProgressionData
			progress: 0,
			workers: {
				forager: 0, // Update worker types to match prehistoric era
				hunter: 0,
				cook: 0,
			},
		};

		// Ensure all resources are initialized to 0
		Object.keys(config.workerBonuses).forEach((resource) => {
			if (!(resource in this.state.resources)) {
				this.state.resources[resource] = 0;
			}
		});

		// Initialize managers
		this.uiManager = new UIManager(this.state, this);
		this.resourceManager = new ResourceManager(
			this.state,
			this.updateProgress.bind(this),
			this.uiManager
		);
		this.workerManager = new WorkerManager(
			this.state,
			this.uiManager,
			this.uiManager.updateUI.bind(this.uiManager)
		);

		// Load era data
		this.eraData = gameProgressionData.eras;
		this.currentEra = 'prehistoric';

		// Timers for events and disasters
		this.eventTimer = null;
		this.disasterTimer = null;

		// Initialize the game
		this.initEra();
		this.startGameLoop();
	}

	// ------------------------------
	// Era Management
	// ------------------------------

	/**
	 * Initializes the current era by updating the UI and scheduling events/disasters.
	 */
	initEra() {
		const era = this.eraData[this.currentEra];
		if (!era) return;

		this.uiManager.updateEraDetails(era);
		this.uiManager.updateUI();
		this.scheduleRandomEvent();
		this.scheduleRandomDisaster();
	}

	/**
	 * Advances the game to the next era if available.
	 */
	advanceToNextEra() {
		const eras = Object.keys(this.eraData);
		const currentIndex = eras.indexOf(this.currentEra);
		if (currentIndex < eras.length - 1) {
			this.currentEra = eras[currentIndex + 1];
			this.initEra();
		}
	}

	// ------------------------------
	// Event and Disaster Management
	// ------------------------------

	/**
	 * Schedules a random event for the current era.
	 */
	scheduleRandomEvent() {
		clearTimeout(this.eventTimer);
		const era = this.eraData[this.currentEra];
		if (!era || !era.events || era.events.length === 0) return;

		this.eventTimer = setTimeout(() => {
			const randomEvent =
				era.events[Math.floor(Math.random() * era.events.length)];
			this.processEvent(randomEvent);
			this.scheduleRandomEvent();
		}, Math.random() * 90000 + 90000); // Random interval between 90-180 seconds
	}

	/**
	 * Schedules a random disaster for the current era.
	 */
	scheduleRandomDisaster() {
		clearTimeout(this.disasterTimer);
		const era = this.eraData[this.currentEra];
		if (!era || !era.disasters || era.disasters.length === 0) return;

		this.disasterTimer = setTimeout(() => {
			const randomDisaster =
				era.disasters[Math.floor(Math.random() * era.disasters.length)];
			this.processDisaster(randomDisaster);
			this.scheduleRandomDisaster();
		}, Math.random() * 120000 + 120000); // Random interval between 120-240 seconds
	}

	/**
	 * Processes a triggered event by applying its effects and logging it.
	 * @param {Object} event - The event to process.
	 */
	processEvent(event) {
		this.uiManager.logEvent(event);
		this.applyEffect(event.effect);
		this.uiManager.updateUI();
	}

	/**
	 * Processes a triggered disaster by applying its effects and logging it.
	 * @param {Object} disaster - The disaster to process.
	 */
	processDisaster(disaster) {
		this.uiManager.logDisaster(disaster);
		this.applyEffect(disaster.effect);
		this.uiManager.updateUI();
	}

	// ------------------------------
	// Resource and Upgrade Management
	// ------------------------------

	/**
	 * Applies an effect to the game state.
	 * @param {Object} effect - The effect to apply.
	 */
	applyEffect(effect) {
		Object.entries(effect).forEach(([key, value]) => {
			if (key in this.state.resources) {
				this.state.resources[key] += this.state.resources[key] * value;
			} else if (key in config) {
				// Handle workerBonuses, probabilities, workerTimers, and gameVariables dynamically
				if (config[key][key]) {
					config[key][key] += value;
				}
			} else if (key === 'unlockFeature') {
				this.state.upgrades[value] = true;
			} else if (key === 'population') {
				this.adjustPopulation(value);
			} else if (key === 'defense') {
				this.state.defense = (this.state.defense || 0) + value;
			} else if (key === 'attackPower') {
				this.state.attackPower = (this.state.attackPower || 0) + value;
			}
		});
	}

	/**
	 * Adjusts the population and handles worker limits.
	 * @param {number} value - The population adjustment value.
	 */
	adjustPopulation(value) {
		this.state.population = Math.floor((this.state.population || 0) + value);
		if (this.state.population < 0) {
			Object.keys(this.state.workers).forEach((workerType) => {
				this.state.workers[workerType] = Math.max(
					0,
					this.state.workers[workerType] + this.state.population
				);
			});
			this.state.population = 0;
		}
	}

	/**
	 * Updates the progress of the current era and transitions to the next era if requirements are met.
	 * @param {number} increment - The progress increment value.
	 */
	updateProgress(increment) {
		this.state.progress += increment;
		const progressionRequirements =
			gameProgressionData.progressionRequirements[this.currentEra];

		if (
			Object.entries(progressionRequirements).every(
				([resource, amount]) => this.state.resources[resource] >= amount
			)
		) {
			this.advanceToNextEra();
		}
	}

	/**
	 * Purchases an upgrade if affordable and applies its effects.
	 * @param {string} id - The ID of the upgrade to purchase.
	 */
	buyUpgrade(id) {
		const upgrade = this.getUpgradeById(id);
		if (!upgrade || !this.canAfford(upgrade.cost)) {
			this.uiManager.showNotification('Cannot afford this upgrade!', 'error');
			return;
		}

		const currentCount = this.state.upgrades[`${id}_count`] || 0;
		if (currentCount >= (upgrade.maxCount || 1)) {
			this.uiManager.showNotification('Upgrade is maxed out!', 'error');
			return;
		}

		this.deductResources(upgrade.cost);
		this.applyUpgradeOrItemEffect(upgrade.effect || {});
		this.incrementUpgradeCount(id);

		this.uiManager.showNotification(`${upgrade.name} purchased!`, 'success');
		this.uiManager.updateUI();
	}

	/**
	 * Retrieves an upgrade by its ID.
	 * @param {string} id - The ID of the upgrade.
	 * @returns {Object} The upgrade object.
	 */
	getUpgradeById(id) {
		return gameProgressionData.eras[this.currentEra].upgrades.find(
			(upgrade) => upgrade.id === id
		);
	}

	/**
	 * Deducts resources from the game state.
	 * @param {Object} cost - The cost object containing resource amounts.
	 */
	deductResources(cost) {
		Object.entries(cost).forEach(([resource, amount]) => {
			if ((this.state.resources[resource] || 0) >= amount) {
				this.state.resources[resource] -= amount;
			} else {
				throw new Error(`Not enough ${resource} to complete the transaction.`);
			}
		});
	}

	/**
	 * Checks if the player can afford a given cost.
	 * @param {Object} cost - The cost object containing resource amounts.
	 * @returns {boolean} True if affordable, false otherwise.
	 */
	canAfford(cost) {
		return Object.entries(cost).every(
			([resource, amount]) => (this.state.resources[resource] || 0) >= amount
		);
	}

	// ------------------------------
	// Game Loop
	// ------------------------------

	/**
	 * Starts the main game loop, updating the UI and managing workers.
	 */
	startGameLoop() {
		Object.keys(config.workerTimers).forEach((workerType) => {
			const efficiencyLevel = this.state.upgrades.efficiency || 0;
			this.workerManager.startWorkerTask(workerType, efficiencyLevel);
		});
		setInterval(() => {
			this.uiManager.updateUI();
		}, 1000);
	}
}

// Expose a global instance for inline onclick handlers
window.game = new GameManager();
