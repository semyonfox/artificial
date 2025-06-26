/**
 * Game Manager - Main game coordination system
 * Handles game logic, progression, and system coordination
 */

import { GameState } from './core/GameState.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { UIManager } from './systems/UIManager.js';
import { WorkerManager } from './systems/WorkerManager.js';
import { EventManager } from './systems/EventManager.js';
import { config } from './core/config.js';

export class GameManager {
	constructor() {
		this.initialized = false;
		this.systems = {};
		this.gameLoopId = null;
		this.lastUpdateTime = performance.now();
		this.gameState = null;

		console.log('GameManager created, starting initialization...');
		this.initialize();
	}

	/**
	 * Initialize the game systems in proper order
	 */
	async initialize() {
		try {
			console.log('Initializing game systems...');

			// Create game state first
			this.gameState = new GameState();

			// Try to load saved game
			const loadSuccess = this.gameState.load();
			if (loadSuccess) {
				console.log('Loaded saved game');
			} else {
				console.log('Starting new game');
			}

			// Initialize systems in dependency order
			this.initializeSystems();

			// Connect system dependencies
			this.connectSystems();

			// Set up event listeners
			this.setupEventListeners();

			// Start game loop
			this.startGameLoop();

			// Start performance monitoring
			this.startPerformanceMonitoring();

			// Initial UI update
			this.updateUI();

			this.initialized = true;
			console.log('Game initialized successfully');
		} catch (error) {
			console.error('Failed to initialize game:', error);
			throw error;
		}
	}

	/**
	 * Initialize all game systems
	 */
	initializeSystems() {
		// Initialize systems that don't depend on others first
		this.systems.resourceManager = new ResourceManager(this.gameState);
		this.systems.workerManager = new WorkerManager(this.gameState);
		this.systems.eventManager = new EventManager(this.gameState);

		// Initialize UI manager last (depends on other systems)
		this.systems.uiManager = new UIManager(this.gameState, this);
	}

	/**
	 * Connect systems that need references to each other
	 */
	connectSystems() {
		// Connect UI manager to other systems
		this.systems.resourceManager.setUIManager(this.systems.uiManager);
		this.systems.workerManager.setUIManager(this.systems.uiManager);
		this.systems.eventManager.setUIManager(this.systems.uiManager);

		// Connect worker manager to game manager for era data
		this.systems.workerManager.setGameManager(this);
	}

	/**
	 * Set up event listeners for cross-system communication
	 */
	setupEventListeners() {
		// Listen for resource changes to update UI
		this.gameState.addListener('resourceChange', (data) => {
			this.updateProgression();
			if (this.systems.uiManager) {
				this.systems.uiManager.updateResources();
			}
		});

		// Listen for worker changes
		this.gameState.addListener('workerChange', (data) => {
			if (this.systems.uiManager) {
				this.systems.uiManager.updateWorkers();
			}
		});

		// Listen for upgrade unlocks
		this.gameState.addListener('upgradeUnlocked', (data) => {
			this.systems.uiManager?.showNotification(
				`Unlocked: ${data.upgradeId}`,
				'success'
			);
			if (this.systems.uiManager) {
				this.systems.uiManager.updateUpgrades();
			}
		});

		// Auto-save every 30 seconds
		setInterval(() => {
			if (this.gameState && this.gameState.data.settings.autoSave) {
				this.gameState.save();
			}
		}, config.storage.autoSaveInterval);
	}

	/**
	 * Start the main game loop
	 */
	startGameLoop() {
		const gameLoop = (currentTime) => {
			const deltaTime = currentTime - this.lastUpdateTime;
			this.lastUpdateTime = currentTime;

			this.update(deltaTime);
			this.gameLoopId = requestAnimationFrame(gameLoop);
		};

		this.gameLoopId = requestAnimationFrame(gameLoop);
	}

	/**
	 * Main game update loop
	 */
	update(deltaTime) {
		if (!this.initialized) return;

		// Update performance stats
		if (this.performanceStats) {
			this.performanceStats.frameCount++;
			this.performanceStats.totalFrameTime += deltaTime;
		}

		// Update total play time
		this.gameState.data.totalPlayTime += deltaTime;

		// Update all systems
		if (this.systems.eventManager) {
			this.systems.eventManager.update(this.lastUpdateTime);
		}

		if (this.systems.workerManager) {
			this.systems.workerManager.update(deltaTime);
		}

		// Update UI periodically (every 1 second)
		if (this.lastUpdateTime % 1000 < deltaTime) {
			this.updateUI();
		}

		// Check for era advancement (every 10 seconds)
		if (this.lastUpdateTime % 10000 < deltaTime) {
			this.checkEraAdvancement();
		}

		// Validate game state periodically (every 5 seconds)
		if (this.lastUpdateTime % 5000 < deltaTime) {
			this.gameState.validate();
		}
	}

	/**
	 * Perform a game action with button feedback
	 */
	performAction(button, action, cooldownMs = 1000) {
		if (button.disabled) return;

		// Disable button temporarily
		button.disabled = true;
		button.style.opacity = '0.6';

		try {
			// Execute the action
			action();

			// Update UI
			this.updateUI();

			// Re-enable button after cooldown
			setTimeout(() => {
				button.disabled = false;
				button.style.opacity = '1';
			}, cooldownMs);
		} catch (error) {
			console.error('Action failed:', error);
			button.disabled = false;
			button.style.opacity = '1';
		}
	}

	/**
	 * Forage for resources
	 */
	forage() {
		this.systems.resourceManager.forage();
		this.updateProgression(1);
	}

	/**
	 * Hunt for food
	 */
	findFood() {
		this.systems.resourceManager.huntAnimal();
		this.updateProgression(1);
	}

	/**
	 * Cook meat
	 */
	cookMeat() {
		this.systems.resourceManager.cookMeatClick();
		this.updateProgression(1);
	}

	/**
	 * Hire a worker
	 */
	hireWorker(workerType) {
		this.systems.workerManager.hireWorker(workerType);
	}

	/**
	 * Buy an upgrade
	 */
	buyUpgrade(upgradeId) {
		const currentEraData = this.getCurrentEraData();
		const upgrade = currentEraData.upgrades.find((u) => u.id === upgradeId);

		if (!upgrade) {
			this.systems.uiManager.showNotification('Upgrade not found', 'error');
			return false;
		}

		if (!this.gameState.canAfford(upgrade.cost)) {
			this.systems.uiManager.showNotification('Cannot afford upgrade', 'error');
			return false;
		}

		if (this.gameState.spendResources(upgrade.cost)) {
			this.gameState.buyUpgrade(upgradeId);
			this.applyUpgradeEffect(upgrade);
			this.systems.uiManager.showNotification(
				`Purchased ${upgrade.name}!`,
				'success'
			);
			this.updateUI();
			return true;
		}

		return false;
	}

	/**
	 * Apply upgrade effects
	 */
	applyUpgradeEffect(upgrade) {
		console.log(`Applied upgrade: ${upgrade.name}`);

		// Apply specific upgrade effects
		switch (upgrade.id) {
			case 'stoneKnapping':
				// Unlock better stone tools and hunting
				this.gameState.upgrades.stoneKnapping = true;
				this.systems.uiManager.showNotification(
					'Stone knapping mastered! Better tools and hunting unlocked!',
					'info',
					4000
				);
				break;

			case 'fireControl':
				// Unlock cooking and fire resource
				this.gameState.upgrades.fireControl = true;
				this.gameState.addResource('fire', 1); // First fire source
				this.systems.uiManager.showNotification(
					'Fire mastered! Cooking unlocked and warmth provided!',
					'info',
					4000
				);
				break;

			case 'boneTools':
				// Double resource efficiency
				this.gameState.upgrades.stickEfficiency *= 2;
				this.gameState.upgrades.stoneEfficiency *= 2;
				this.gameState.upgrades.huntingEfficiency *= 2;
				this.systems.uiManager.showNotification(
					'Bone tools crafted! All resource gathering doubled!',
					'success',
					4000
				);
				break;

			case 'furClothing':
				// Improve survival and worker efficiency
				this.gameState.upgrades.populationGrowth = 1.5;
				this.systems.uiManager.showNotification(
					'Fur clothing created! Population grows faster and workers are more efficient!',
					'info',
					4000
				);
				break;

			case 'shelterBuilding':
				// Protect from disasters and allow larger population
				this.gameState.upgrades.disasterResistance = 0.5; // 50% less disaster damage
				this.systems.uiManager.showNotification(
					'Shelters built! Protection from disasters and larger communities possible!',
					'success',
					4000
				);
				break;
		}
	}

	/**
	 * Check if player can afford something
	 */
	canAfford(cost) {
		return this.gameState.canAfford(cost);
	}

	/**
	 * Update game progression
	 */
	updateProgression(amount = 1) {
		// Simple progression tracking
		if (this.gameState && this.gameState.data) {
			this.gameState.data.progression = this.gameState.data.progression || {
				totalClicks: 0,
			};
			this.gameState.data.progression.totalClicks += amount;
		}
	}

	/**
	 * Update the UI display
	 */
	updateUI() {
		if (this.systems.uiManager) {
			this.systems.uiManager.updateUI();
		}
	}

	/**
	 * Save the game
	 */
	saveGame() {
		try {
			const success = this.gameState.save();
			if (success) {
				this.systems.uiManager?.showNotification(
					'Game saved successfully!',
					'success'
				);
			} else {
				this.systems.uiManager?.showNotification(
					'Failed to save game',
					'error'
				);
			}
			return success;
		} catch (error) {
			console.error('Save game error:', error);
			this.systems.uiManager?.showNotification('Error saving game', 'error');
			return false;
		}
	}

	/**
	 * Load the game
	 */
	loadGame() {
		try {
			const success = this.gameState.load();
			if (success) {
				this.systems.uiManager?.showNotification(
					'Game loaded successfully!',
					'success'
				);
				this.updateUI();
				// Restart worker automation for loaded workers
				this.restartWorkerAutomation();
			} else {
				this.systems.uiManager?.showNotification(
					'No saved game found',
					'warning'
				);
			}
			return success;
		} catch (error) {
			console.error('Load game error:', error);
			this.systems.uiManager?.showNotification('Error loading game', 'error');
			return false;
		}
	}

	/**
	 * Reset the game
	 */
	resetGame() {
		if (
			confirm('Are you sure you want to reset the game? This cannot be undone.')
		) {
			try {
				// Stop all systems
				this.stopAllSystems();

				// Reset game state
				this.gameState.reset();

				// Clear localStorage
				localStorage.removeItem(config.storage.saveKey);

				// Restart worker automation
				this.restartWorkerAutomation();

				// Update UI
				this.updateUI();

				this.systems.uiManager?.showNotification(
					'Game reset successfully!',
					'info'
				);
				return true;
			} catch (error) {
				console.error('Reset game error:', error);
				this.systems.uiManager?.showNotification(
					'Error resetting game',
					'error'
				);
				return false;
			}
		}
		return false;
	}

	/**
	 * Stop all running systems
	 */
	stopAllSystems() {
		// Stop worker automation
		if (this.systems.workerManager) {
			this.systems.workerManager.stopAllWorkers();
		}

		// Stop game loop
		if (this.gameLoopId) {
			cancelAnimationFrame(this.gameLoopId);
			this.gameLoopId = null;
		}
	}

	/**
	 * Restart worker automation after load/reset
	 */
	restartWorkerAutomation() {
		if (this.systems.workerManager) {
			this.systems.workerManager.restartAllWorkers();
		}
	}

	/**
	 * Get current era data with workers and upgrades
	 */
	getCurrentEraData() {
		const eraData = this.getAllEraData();
		return eraData[this.gameState.data.currentEra] || eraData.paleolithic;
	}

	/**
	 * Get comprehensive data for all eras
	 */
	getAllEraData() {
		return {
			paleolithic: {
				id: 'paleolithic',
				name: 'Paleolithic Era',
				timespan: '2.6M - 10K BCE',
				description:
					"The Old Stone Age - humanity's longest period of hunter-gatherer societies and stone tool use.",
				advancementCost: { population: 25, fire: 10, bones: 50 },
				workers: [
					{
						id: 'gatherer',
						name: 'Gatherer',
						description:
							'Collects sticks, stones, and plant materials. The foundation of Paleolithic survival.',
						cost: { sticks: 8, cookedMeat: 2 },
						produces: { sticks: 1, stones: 0.3 },
						interval: 4000,
					},
					{
						id: 'hunter',
						name: 'Hunter',
						description:
							'Hunts animals for meat, bones, and fur using stone tools. Requires stone knapping knowledge.',
						cost: { stones: 12, bones: 3, cookedMeat: 4 },
						produces: { meat: 1, bones: 0.4, fur: 0.3 },
						interval: 6000,
						requiresUpgrade: 'stoneKnapping',
					},
					{
						id: 'cook',
						name: 'Cook',
						description:
							'Cooks meat over fire, making it safer and more nutritious. Essential for population growth.',
						cost: { sticks: 15, stones: 3, fire: 1, cookedMeat: 1 },
						produces: { cookedMeat: 2, fire: 0.1 },
						consumes: { meat: 1 },
						interval: 3000,
						requiresUpgrade: 'fireControl',
					},
				],
				upgrades: [
					{
						id: 'stoneKnapping',
						name: 'Stone Knapping',
						description:
							'Master the art of shaping stone into sharp tools and weapons',
						cost: { stones: 20, sticks: 15 },
						effect: 'Unlocks hunting and improves tool efficiency',
						priority: 1,
						historical:
							"Stone knapping was humanity's first technology, dating back 2.6 million years.",
					},
					{
						id: 'fireControl',
						name: 'Fire Control',
						description:
							'Learn to make and maintain fire - a revolutionary survival technology',
						cost: { sticks: 25, stones: 10 },
						effect:
							'Unlocks cooking, provides warmth, and enables advanced crafting',
						priority: 2,
						historical:
							'Controlled use of fire began around 790,000 years ago, transforming human evolution.',
					},
					{
						id: 'boneTools',
						name: 'Bone Tools',
						description:
							'Craft specialized tools from animal bones for better efficiency',
						cost: { bones: 10, stones: 8, fire: 2 },
						effect: 'Doubles all resource gathering efficiency',
						priority: 3,
						historical:
							'Bone tools appeared around 90,000 years ago, showing advanced craftsmanship.',
					},
					{
						id: 'furClothing',
						name: 'Fur Clothing',
						description:
							'Create warm clothing from animal furs for survival in harsh climates',
						cost: { fur: 12, bones: 5, fire: 1 },
						effect: 'Increases population growth and worker survival',
						priority: 4,
						historical:
							'Clothing likely developed 170,000 years ago, enabling migration to colder regions.',
					},
					{
						id: 'shelterBuilding',
						name: 'Shelter Construction',
						description:
							'Build permanent shelters using sticks, stones, and fur',
						cost: { sticks: 30, stones: 20, fur: 8, bones: 6 },
						effect: 'Reduces disaster damage and allows larger communities',
						priority: 5,
						historical:
							'The oldest known structures date to 400,000 years ago in Terra Amata, France.',
					},
				],
			},

			neolithic: {
				id: 'neolithic',
				name: 'Neolithic Era',
				timespan: '10K - 3.3K BCE',
				description:
					'The New Stone Age - the Agricultural Revolution begins with farming and permanent settlements.',
				advancementCost: { population: 100, grain: 200, pottery: 50 },
				workers: [
					{
						id: 'farmer',
						name: 'Farmer',
						description:
							'Cultivates grain crops, revolutionizing food production and enabling larger populations.',
						cost: { grain: 15, tools: 5, pottery: 3 },
						produces: { grain: 3, population: 0.1 },
						interval: 8000,
					},
					{
						id: 'potter',
						name: 'Potter',
						description:
							'Creates clay vessels for storage and cooking, essential for agricultural society.',
						cost: { clay: 20, grain: 10, fire: 2 },
						produces: { pottery: 2, tools: 0.3 },
						interval: 6000,
						requiresUpgrade: 'pottery',
					},
					{
						id: 'herder',
						name: 'Herder',
						description:
							'Domesticates and raises livestock for meat, milk, and textiles.',
						cost: { grain: 25, pottery: 8, livestock: 2 },
						produces: { livestock: 1, meat: 1.5, textiles: 0.5 },
						interval: 10000,
						requiresUpgrade: 'animalDomestication',
					},
				],
				upgrades: [
					{
						id: 'agriculture',
						name: 'Agriculture',
						description: 'Develop systematic farming techniques to grow crops',
						cost: { grain: 50, tools: 20, population: 10 },
						effect: 'Unlocks farming and greatly increases food production',
						priority: 1,
						historical:
							'Agriculture developed independently around 10,000 BCE in the Fertile Crescent.',
					},
					{
						id: 'pottery',
						name: 'Pottery Making',
						description: 'Master the art of shaping and firing clay vessels',
						cost: { clay: 30, fire: 10, tools: 15 },
						effect: 'Unlocks pottery production and food storage',
						priority: 2,
						historical:
							'Pottery appeared around 18,000 BCE, enabling food storage and cooking.',
					},
					{
						id: 'animalDomestication',
						name: 'Animal Domestication',
						description: 'Tame wild animals for food, labor, and materials',
						cost: { grain: 40, livestock: 10, pottery: 20 },
						effect: 'Unlocks livestock production and increases meat yield',
						priority: 3,
						historical:
							'Dogs were first domesticated 15,000 years ago, followed by sheep and goats.',
					},
					{
						id: 'weaving',
						name: 'Textile Weaving',
						description: 'Create cloth from plant and animal fibers',
						cost: { textiles: 25, tools: 18, livestock: 5 },
						effect: 'Improves clothing and trade opportunities',
						priority: 4,
						historical:
							'Textile production began around 7000 BCE with linen in Egypt.',
					},
					{
						id: 'settlement',
						name: 'Permanent Settlement',
						description:
							'Establish permanent villages with structured communities',
						cost: { pottery: 40, grain: 60, population: 25 },
						effect: 'Increases population capacity and enables specialization',
						priority: 5,
						historical:
							'Çatalhöyük (7500 BCE) was one of the first large permanent settlements.',
					},
				],
			},

			bronze: {
				id: 'bronze',
				name: 'Bronze Age',
				timespan: '3300 - 1200 BCE',
				description:
					'First metal working civilizations emerge with bronze tools revolutionizing society.',
				advancementCost: { bronze: 500, writing: 100, trade: 200 },
				workers: [
					{
						id: 'metalworker',
						name: 'Metalworker',
						description:
							'Smelts copper and tin to create bronze tools and weapons.',
						cost: { copper: 30, tin: 10, bronze: 5 },
						produces: { bronze: 2, tools: 1 },
						interval: 12000,
						requiresUpgrade: 'bronzeWorking',
					},
					{
						id: 'scribe',
						name: 'Scribe',
						description:
							'Records information using early writing systems for administration.',
						cost: { writing: 15, bronze: 8, trade: 5 },
						produces: { writing: 2, knowledge: 0.5 },
						interval: 15000,
						requiresUpgrade: 'writing',
					},
					{
						id: 'merchant',
						name: 'Merchant',
						description:
							'Facilitates trade between communities using wheels and roads.',
						cost: { bronze: 20, wheel: 5, trade: 10 },
						produces: { trade: 3, bronze: 0.5, wheel: 0.2 },
						interval: 10000,
						requiresUpgrade: 'wheel',
					},
				],
				upgrades: [
					{
						id: 'bronzeWorking',
						name: 'Bronze Working',
						description:
							'Master the smelting of copper and tin to create bronze',
						cost: { copper: 100, tin: 50, tools: 40 },
						effect: 'Unlocks bronze production and stronger tools',
						priority: 1,
						historical:
							'Bronze working began around 3500 BCE, marking the start of metallurgy.',
					},
					{
						id: 'writing',
						name: 'Writing System',
						description: 'Develop symbols to record language and information',
						cost: { knowledge: 30, trade: 25, bronze: 15 },
						effect: 'Enables record keeping and complex administration',
						priority: 2,
						historical:
							'Cuneiform writing emerged in Mesopotamia around 3400 BCE.',
					},
					{
						id: 'wheel',
						name: 'The Wheel',
						description:
							'Invent the wheel for transportation and pottery making',
						cost: { bronze: 40, trade: 30, tools: 25 },
						effect: 'Revolutionizes transportation and trade',
						priority: 3,
						historical:
							'The wheel was invented around 3500 BCE in Mesopotamia.',
					},
					{
						id: 'urbanPlanning',
						name: 'Urban Planning',
						description: 'Design organized cities with specialized districts',
						cost: { bronze: 60, writing: 40, trade: 50 },
						effect: 'Enables larger, more efficient cities',
						priority: 4,
						historical:
							'Early urban planning is seen in Harappan cities around 2600 BCE.',
					},
					{
						id: 'mathematics',
						name: 'Mathematics',
						description: 'Develop numerical systems and geometric principles',
						cost: { writing: 50, knowledge: 35, bronze: 25 },
						effect: 'Advances engineering and trade calculations',
						priority: 5,
						historical:
							'Babylonian mathematics developed around 2000 BCE with positional notation.',
					},
				],
			},

			iron: {
				id: 'iron',
				name: 'Iron Age',
				timespan: '1200 - 600 BCE',
				description:
					'Iron working spreads, creating stronger tools and weapons, leading to great empires.',
				advancementCost: { iron: 800, cities: 50, knowledge: 300 },
				workers: [
					{
						id: 'blacksmith',
						name: 'Blacksmith',
						description:
							'Forges iron into superior tools, weapons, and agricultural implements.',
						cost: { iron: 40, steel: 15, cities: 5 },
						produces: { steel: 2, tools: 2, iron: 0.5 },
						interval: 10000,
						requiresUpgrade: 'ironWorking',
					},
					{
						id: 'engineer',
						name: 'Engineer',
						description:
							'Designs roads, bridges, and infrastructure for growing civilizations.',
						cost: { steel: 25, knowledge: 20, cities: 8 },
						produces: { roads: 1, cities: 0.3, engineering: 0.5 },
						interval: 18000,
						requiresUpgrade: 'engineering',
					},
					{
						id: 'scholar',
						name: 'Scholar',
						description:
							'Studies philosophy, mathematics, and natural phenomena.',
						cost: { knowledge: 30, cities: 10, steel: 12 },
						produces: { knowledge: 3, philosophy: 0.5 },
						interval: 20000,
						requiresUpgrade: 'philosophy',
					},
				],
				upgrades: [
					{
						id: 'ironWorking',
						name: 'Iron Working',
						description:
							'Master the smelting of iron ore to create superior tools',
						cost: { iron: 150, steel: 50, knowledge: 40 },
						effect: 'Unlocks advanced metallurgy and stronger equipment',
						priority: 1,
						historical:
							'Iron working began around 1500 BCE in Anatolia and spread globally.',
					},
					{
						id: 'engineering',
						name: 'Civil Engineering',
						description: 'Design and build large-scale infrastructure projects',
						cost: { steel: 80, roads: 30, cities: 20 },
						effect: 'Enables advanced construction and city planning',
						priority: 2,
						historical:
							'Roman engineering achievements like aqueducts transformed civilization.',
					},
					{
						id: 'philosophy',
						name: 'Philosophy',
						description:
							'Develop systematic thinking about ethics, logic, and nature',
						cost: { knowledge: 100, cities: 25, steel: 40 },
						effect: 'Advances intellectual development and governance',
						priority: 3,
						historical:
							'Greek philosophy (6th century BCE) laid foundations for Western thought.',
					},
					{
						id: 'coinage',
						name: 'Coined Money',
						description: 'Standardize currency for more efficient trade',
						cost: { steel: 60, trade: 80, cities: 15 },
						effect: 'Revolutionizes commerce and economic systems',
						priority: 4,
						historical: 'First coins appeared in Lydia around 650 BCE.',
					},
					{
						id: 'militaryTactics',
						name: 'Military Tactics',
						description: 'Develop organized warfare and strategic thinking',
						cost: { steel: 100, knowledge: 50, cities: 30 },
						effect: 'Improves defense and enables territorial expansion',
						priority: 5,
						historical:
							'Greek phalanx and Roman legions revolutionized warfare.',
					},
				],
			},

			industrial: {
				id: 'industrial',
				name: 'Industrial Age',
				timespan: '1760 - 1840',
				description:
					'The Industrial Revolution transforms society with steam power and mass production.',
				advancementCost: { electricity: 1000, factories: 200, railways: 150 },
				workers: [
					{
						id: 'factoryWorker',
						name: 'Factory Worker',
						description:
							'Operates steam-powered machinery for mass production.',
						cost: { coal: 50, steam: 20, factories: 3 },
						produces: { factories: 1, steam: 1, coal: 0.3 },
						interval: 8000,
						requiresUpgrade: 'steamEngine',
					},
					{
						id: 'railwayEngineer',
						name: 'Railway Engineer',
						description:
							'Designs and maintains steam-powered transportation networks.',
						cost: { steel: 80, steam: 30, railways: 5 },
						produces: { railways: 2, steam: 0.5, electricity: 0.2 },
						interval: 15000,
						requiresUpgrade: 'railways',
					},
					{
						id: 'inventor',
						name: 'Inventor',
						description:
							'Develops new technologies and improves existing machinery.',
						cost: { electricity: 40, factories: 15, steel: 25 },
						produces: { electricity: 3, steam: 1, factories: 0.5 },
						interval: 12000,
						requiresUpgrade: 'electricity',
					},
				],
				upgrades: [
					{
						id: 'steamEngine',
						name: 'Steam Engine',
						description:
							'Harness steam power to drive machinery and transportation',
						cost: { coal: 200, steel: 150, factories: 50 },
						effect: 'Revolutionizes manufacturing and transportation',
						priority: 1,
						historical:
							"James Watt's improved steam engine (1769) powered the Industrial Revolution.",
					},
					{
						id: 'railways',
						name: 'Railway System',
						description:
							'Build steam-powered railway networks for cargo and passengers',
						cost: { steel: 300, steam: 100, coal: 200 },
						effect: 'Transforms trade and enables rapid expansion',
						priority: 2,
						historical:
							'The first public railway opened in 1825 between Stockton and Darlington.',
					},
					{
						id: 'electricity',
						name: 'Electrical Power',
						description: 'Generate and distribute electrical energy',
						cost: { steam: 200, steel: 180, factories: 80 },
						effect: 'Powers advanced machinery and lighting',
						priority: 3,
						historical:
							"Edison's power station (1882) began the electrical age.",
					},
					{
						id: 'massProduction',
						name: 'Mass Production',
						description:
							'Develop assembly line techniques for efficient manufacturing',
						cost: { factories: 150, electricity: 120, railways: 60 },
						effect: 'Dramatically increases production efficiency',
						priority: 4,
						historical:
							"Henry Ford's assembly line (1913) revolutionized manufacturing.",
					},
					{
						id: 'telegraphSystem',
						name: 'Telegraph System',
						description:
							'Enable long-distance communication through electrical signals',
						cost: { electricity: 180, railways: 80, steel: 120 },
						effect: 'Revolutionizes communication and coordination',
						priority: 5,
						historical:
							"Samuel Morse's telegraph (1844) connected distant cities instantly.",
					},
				],
			},

			information: {
				id: 'information',
				name: 'Information Age',
				timespan: '1950 - 2020',
				description:
					'The Digital Revolution brings computers, internet, and global connectivity.',
				advancementCost: { computers: 2000, internet: 500, satellites: 100 },
				workers: [
					{
						id: 'programmer',
						name: 'Programmer',
						description:
							'Develops software and applications for digital systems.',
						cost: { silicon: 100, computers: 20, data: 50 },
						produces: { software: 3, data: 2, computers: 0.5 },
						interval: 6000,
						requiresUpgrade: 'programming',
					},
					{
						id: 'networkEngineer',
						name: 'Network Engineer',
						description: 'Builds and maintains global communication networks.',
						cost: { computers: 50, internet: 15, satellites: 5 },
						produces: { internet: 2, satellites: 0.3, data: 1 },
						interval: 10000,
						requiresUpgrade: 'internet',
					},
					{
						id: 'dataScientist',
						name: 'Data Scientist',
						description:
							'Analyzes vast amounts of information to extract insights.',
						cost: { data: 80, software: 30, computers: 25 },
						produces: { data: 4, software: 1, satellites: 0.2 },
						interval: 8000,
						requiresUpgrade: 'dataAnalysis',
					},
				],
				upgrades: [
					{
						id: 'programming',
						name: 'Computer Programming',
						description: 'Develop languages and methods to instruct computers',
						cost: { silicon: 300, computers: 100, data: 150 },
						effect: 'Unlocks software development and automation',
						priority: 1,
						historical:
							'FORTRAN (1957) was among the first high-level programming languages.',
					},
					{
						id: 'internet',
						name: 'Internet Protocol',
						description: 'Create global network for sharing information',
						cost: { computers: 200, data: 250, software: 120 },
						effect: 'Enables worldwide digital communication',
						priority: 2,
						historical:
							'ARPANET (1969) evolved into the modern internet by the 1990s.',
					},
					{
						id: 'dataAnalysis',
						name: 'Big Data Analytics',
						description: 'Process and analyze massive datasets for insights',
						cost: { data: 400, software: 200, internet: 100 },
						effect: 'Extracts valuable patterns from information',
						priority: 3,
						historical:
							'Big Data emerged in the 2000s with exponential information growth.',
					},
					{
						id: 'artificialIntelligence',
						name: 'Artificial Intelligence',
						description: 'Create machines capable of intelligent behavior',
						cost: { software: 500, data: 300, satellites: 50 },
						effect: 'Enables automated decision making and learning',
						priority: 4,
						historical:
							'Modern AI breakthrough occurred with deep learning in the 2010s.',
					},
					{
						id: 'quantumComputing',
						name: 'Quantum Computing',
						description:
							'Harness quantum mechanics for unprecedented computing power',
						cost: { silicon: 800, software: 400, data: 600 },
						effect: 'Solves previously impossible computational problems',
						priority: 5,
						historical:
							'Quantum computers achieved "quantum supremacy" in 2019.',
					},
				],
			},
		};
	}

	/**
	 * Check if era advancement is possible and notify player
	 */
	checkEraAdvancement() {
		if (this.gameState.canAdvanceEra()) {
			const currentEra = this.gameState.data.currentEra;
			const nextEra = this.getNextEra(currentEra);

			if (nextEra) {
				this.systems.uiManager?.showNotification(
					`🌟 Ready to advance to ${
						config.eras[nextEra]?.name || nextEra
					}! Check the era panel.`,
					'info',
					8000
				);
			}
		}
	}

	/**
	 * Get the next era in progression
	 */
	getNextEra(currentEra) {
		const eraOrder = [
			'paleolithic',
			'neolithic',
			'bronze',
			'iron',
			'classical',
			'medieval',
			'renaissance',
			'industrial',
			'information',
			'space',
			'galactic',
			'universal',
		];
		const currentIndex = eraOrder.indexOf(currentEra);

		if (currentIndex >= 0 && currentIndex < eraOrder.length - 1) {
			return eraOrder[currentIndex + 1];
		}

		return null;
	}

	/**
	 * Advance to the next era
	 */
	advanceEra() {
		const currentEra = this.gameState.data.currentEra;
		const nextEra = this.getNextEra(currentEra);

		if (!nextEra) {
			this.systems.uiManager?.showNotification(
				'You are already in the final era!',
				'warning'
			);
			return false;
		}

		if (!this.gameState.canAdvanceEra()) {
			this.systems.uiManager?.showNotification(
				'Requirements not met for era advancement',
				'error'
			);
			return false;
		}

		// Advance the era
		this.gameState.data.currentEra = nextEra;

		// Reset era-specific progress
		this.gameState.data.progression.eraProgress = 0;

		// Show advancement notification
		const eraInfo = config.eras[nextEra];
		this.systems.uiManager?.showNotification(
			`🎉 Entered the ${eraInfo?.name || nextEra}! ${
				eraInfo?.description || ''
			}`,
			'success',
			10000
		);

		// Trigger listeners
		this.gameState.notifyListeners('eraAdvancement', {
			oldEra: currentEra,
			newEra: nextEra,
		});

		// Update UI
		this.updateUI();

		console.log(`Advanced from ${currentEra} to ${nextEra}`);
		return true;
	}

	/**
	 * Handle era transition effects
	 */
	onEraTransition(fromEra, toEra) {
		// Add some starting resources for the new era
		const newEraData = this.getCurrentEraData();

		// Grant small amounts of new era's basic resources
		if (toEra === 'neolithic') {
			this.gameState.addResource('grain', 10);
			this.gameState.addResource('clay', 5);
		} else if (toEra === 'bronze') {
			this.gameState.addResource('copper', 15);
			this.gameState.addResource('tin', 5);
		} else if (toEra === 'iron') {
			this.gameState.addResource('iron', 20);
		} else if (toEra === 'industrial') {
			this.gameState.addResource('coal', 50);
		} else if (toEra === 'information') {
			this.gameState.addResource('silicon', 25);
		}

		console.log(`Era transition: ${fromEra} -> ${toEra}`);
	}

	/**
	 * Destroy the game manager and cleanup resources
	 */
	destroy() {
		try {
			// Stop all systems
			this.stopAllSystems();

			// Stop performance monitoring
			this.stopPerformanceMonitoring();

			// Clear all event listeners
			this.gameState?.removeAllListeners();

			// Clear auto-save interval
			if (this.autoSaveInterval) {
				clearInterval(this.autoSaveInterval);
				this.autoSaveInterval = null;
			}

			// Reset references
			this.gameState = null;
			this.systems = {};
			this.initialized = false;

			console.log('GameManager destroyed');
		} catch (error) {
			console.error('Error destroying GameManager:', error);
		}
	}

	/**
	 * Get game statistics for debugging and analytics
	 */
	getGameStats() {
		if (!this.gameState) return null;

		const data = this.gameState.data;
		const totalResources = Object.values(data.resources).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalWorkers = Object.values(data.workers).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalUpgrades = Object.values(data.upgrades).filter(Boolean).length;

		return {
			era: data.currentEra,
			playTime: data.totalPlayTime,
			totalResources,
			totalWorkers,
			totalUpgrades,
			population: data.resources.population || 0,
			progression: data.progression,
		};
	}

	/**
	 * Performance monitoring and optimization
	 */
	startPerformanceMonitoring() {
		this.performanceStats = {
			frameCount: 0,
			totalFrameTime: 0,
			averageFPS: 0,
			lastFPSUpdate: performance.now(),
		};

		// Update FPS every second
		this.fpsUpdateInterval = setInterval(() => {
			const now = performance.now();
			const deltaTime = now - this.performanceStats.lastFPSUpdate;

			if (deltaTime >= 1000) {
				this.performanceStats.averageFPS = Math.round(
					(this.performanceStats.frameCount * 1000) / deltaTime
				);
				this.performanceStats.frameCount = 0;
				this.performanceStats.lastFPSUpdate = now;
			}
		}, 1000);
	}

	/**
	 * Stop performance monitoring
	 */
	stopPerformanceMonitoring() {
		if (this.fpsUpdateInterval) {
			clearInterval(this.fpsUpdateInterval);
			this.fpsUpdateInterval = null;
		}
		this.performanceStats = null;
	}

	/**
	 * Get performance statistics
	 */
	getPerformanceStats() {
		return this.performanceStats ? { ...this.performanceStats } : null;
	}
}
