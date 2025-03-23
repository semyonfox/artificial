import { config } from './config.js';
import { ResourceManager } from './ResourceManager.js';
import { UIManager } from './UIManager.js';
import { WorkerManager } from './WorkerManager.js';
import { gameProgressionData } from './gamedata.js';

export class GameManager {
	constructor() {
		// Initialize game state
		this.state = {
			resources: {
				sticks: 0,
				stones: 0,
				meat: 0,
				cookedMeat: 0,
				bones: 0, // Initialize bones
				fur: 0, // Initialize fur
			},
			upgrades: {},
			age: 'prehistoric',
			progress: 0,
			workers: {
				woodcutter: 0,
				miner: 0,
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

	// Initialize the current era
	initEra() {
		const era = this.eraData[this.currentEra];
		if (!era) return;

		this.uiManager.updateEraDetails(era);
		this.uiManager.updateUI();
		this.scheduleRandomEvent();
		this.scheduleRandomDisaster();
	}

	// Transition to the next era
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

	// Schedule a random event
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

	// Schedule a random disaster
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

	// Process an event
	processEvent(event) {
		this.uiManager.logEvent(event);
		this.applyEffect(event.effect);
		this.uiManager.updateUI();
	}

	// Process a disaster
	processDisaster(disaster) {
		this.uiManager.logDisaster(disaster);
		this.applyEffect(disaster.effect);
		this.uiManager.updateUI();
	}

	// ------------------------------
	// Resource and Upgrade Management
	// ------------------------------

	// Apply effects to the game state
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

	// Adjust population and handle worker limits
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

	// Apply the effects of an upgrade or item
	applyUpgradeOrItemEffect(effect) {
		if (effect.unlocks) {
			effect.unlocks.forEach((feature) => {
				this.state.upgrades[feature] = true;

				const era = this.eraData[this.state.age];
				if (era) {
					if (era.items?.some((item) => item.id === feature)) {
						this.state.upgrades[`${feature}_unlocked`] = true;
					} else if (feature === 'hunting') {
						this.state.upgrades.hunting_unlocked = true;
					} else if (feature === 'cooking') {
						this.state.upgrades.cooking_unlocked = true;
					}
				}
			});
		}
		if (effect.buff || effect) {
			this.applyEffect(effect.buff || effect);
		}
		this.uiManager.updateUI();
	}

	// Update the progress of the current era and transition to the next era if needed
	updateProgress(increment) {
		this.state.progress += increment;
		const currentEraData = this.eraData[this.currentEra];
		const progressionRequirements =
			gameProgressionData.progressionRequirements[this.currentEra];

		if (
			Object.entries(progressionRequirements).every(
				([resource, amount]) => this.state.resources[resource] >= amount
			)
		) {
			const allUpgradesBought = currentEraData.upgrades.every(
				(upgrade) =>
					(this.state.upgrades[`${upgrade.id}_count`] || 0) >=
					(upgrade.maxCount || 1)
			);
			const allItemsBought = currentEraData.items.every(
				(item) =>
					(this.state.upgrades[`${item.id}_count`] || 0) >= (item.maxCount || 1)
			);

			if (allUpgradesBought && allItemsBought) {
				this.uiManager.cutsceneManager.triggerEraCutscene(
					this.eraData[this.currentEra]
				);
				this.advanceToNextEra();
			}
		}
	}

	// Purchase an upgrade
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

	// Apply the effects of an upgrade based on its level
	applyUpgradeEffect(upgrade, level) {
		if (upgrade.effectPerLevel) {
			Object.entries(upgrade.effectPerLevel).forEach(([stat, value]) => {
				this.state[stat] = (this.state[stat] || 0) + value * level;
			});
		}
	}

	// Purchase the maximum number of upgrades possible
	buyMax(id) {
		while (this.canAffordUpgrade(id)) {
			this.buyUpgrade(id);
		}
	}

	// Check if an upgrade can be afforded
	canAffordUpgrade(upgrade) {
		if (!upgrade || !upgrade.cost) return false;
		return Object.entries(upgrade.cost).every(
			([r, a]) => this.state.resources[r] >= a
		);
	}

	// Purchase an item if resources are sufficient
	buyItem(id) {
		const item = this.getItemById(id);
		if (!item || !this.canAfford(item.cost)) {
			this.uiManager.showNotification('Cannot afford this item!', 'error');
			return;
		}

		const currentCount = this.state.upgrades[`${id}_count`] || 0;
		if (currentCount >= (item.maxCount || 1)) {
			this.uiManager.showNotification('Item is maxed out!', 'error');
			return;
		}

		// Deduct resources and apply effects
		this.deductResources(item.cost);
		this.applyUpgradeOrItemEffect(item.effect || {});
		this.incrementUpgradeCount(id);

		this.uiManager.showNotification(`${item.name} purchased!`, 'success');
		this.uiManager.updateUI();
	}

	// Check if an item can be afforded
	canAffordItem(item) {
		if (!item || !item.cost) return false;
		return Object.entries(item.cost).every(
			([r, a]) => this.state.resources[r] >= a
		);
	}

	getUpgradeById(id) {
		return gameProgressionData.eras[this.currentEra].upgrades.find(
			(upgrade) => upgrade.id === id
		);
	}

	getItemById(id) {
		return gameProgressionData.eras[this.currentEra].items.find(
			(item) => item.id === id
		);
	}

	canAfford(cost) {
		return Object.entries(cost).every(
			([resource, amount]) => (this.state.resources[resource] || 0) >= amount
		);
	}

	deductResources(cost) {
		Object.entries(cost).forEach(([resource, amount]) => {
			if ((this.state.resources[resource] || 0) >= amount) {
				this.state.resources[resource] -= amount;
			} else {
				throw new Error(`Not enough ${resource} to complete the transaction.`);
			}
		});
	}

	incrementUpgradeCount(id) {
		this.state.upgrades[`${id}_count`] =
			(this.state.upgrades[`${id}_count`] || 0) + 1;
	}

	// Find food and add it to the resources
	findFood() {
		const foodReward = Math.floor(Math.random() * 4) + 2;
		this.state.resources.meat += foodReward;
		this.uiManager.updateUI();
	}

	// ------------------------------
	// Worker Management
	// ------------------------------

	// Hire a worker of a specific type if resources are sufficient
	hireWorker(workerType) {
		const baseCost = config.workerTimers[workerType] || 10; // Use config for base cost
		const multiplier = 1.5;
		const workerCount = this.state.workers[workerType] || 0;

		const cost = Math.ceil(baseCost * Math.pow(multiplier, workerCount));

		if (this.state.resources.cookedMeat >= cost) {
			this.state.resources.cookedMeat -= cost;
			this.state.workers[workerType] =
				(this.state.workers[workerType] || 0) + 1;

			const efficiencyLevel = this.state.upgrades.efficiency || 0;
			this.workerManager.startWorkerTask(workerType, efficiencyLevel);

			this.uiManager.updateUI();
		} else {
			this.uiManager.showNotification(
				`Not enough food to hire a ${workerType}!`,
				'error'
			);
		}
	}

	// ------------------------------
	// UI Management
	// ------------------------------

	// Update the visibility and text of buttons based on the game state
	updateButtons() {
		this.uiManager.elements.huntButton.classList.toggle(
			'hidden',
			!this.state.upgrades.hunting_unlocked
		);
		this.uiManager.elements.cookButton.classList.toggle(
			'hidden',
			!this.state.upgrades.cooking_unlocked
		);
		Object.entries(this.uiManager.elements.hireButtons).forEach(
			([type, button]) => {
				button.textContent = `Hire ${
					type.charAt(0).toUpperCase() + type.slice(1)
				} (${this.formatCost(this.workerManager.getWorkerCost(type))})`;
			}
		);
		this.uiManager.renderUpgrades();
		this.uiManager.renderItems();
	}

	// Perform an action with a delay and update the UI
	performAction(button, action, delay) {
		const wrapper = button.closest('.action-wrapper');
		const progress = wrapper ? wrapper.querySelector('.action-progress') : null;
		button.disabled = true;
		if (progress) {
			progress.style.width = '0%';
			progress.style.transition = `width ${delay}ms linear`;
			progress.offsetHeight;
			progress.style.width = '100%';
		}
		setTimeout(() => {
			action();

			if (button.id === 'forage-button') {
				this.workerManager.triggerWorkerAction(
					'woodcutter',
					'sticks',
					config.yields.huntYield,
					'workerBonusStick'
				);
			} else if (button.id === 'hunt-button') {
				this.workerManager.triggerWorkerAction(
					'hunter',
					'meat',
					config.yields.huntYield,
					'workerBonusMeat'
				);
			} else if (button.id === 'cook-button') {
				this.workerManager.triggerWorkerAction(
					'cook',
					'cookedMeat',
					config.yields.huntYield,
					'workerBonusCook'
				);
			}

			button.disabled = false;
			if (progress) progress.style.width = '0%';
		}, delay);
	}

	// ------------------------------
	// Game Loop
	// ------------------------------

	// Start the game loop
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
