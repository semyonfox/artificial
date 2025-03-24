(function () {
	'use strict';

	// config.js
	const config = {
		eras: {
			prehistoric: { order: 1 },
			stoneAge: { order: 2 },
			bronzeAge: { order: 3 },
			ironAge: { order: 4 },
			industrialAge: { order: 5 },
			informationAge: { order: 6 },
			stellarDominion: { order: 7 },
			galacticFederation: { order: 8 },
			universalAscendancy: { order: 9 },
		},

		workerTimers: {
			forager: 5000,
			hunter: 6000,
			cook: 4000,
			farmer: 8000,
			potter: 6500,
			copperMiner: 7000,
			tinTrader: 7500,
			scribe: 9000,
			blacksmith: 8500,
			soldier: 6000,
			coalMiner: 7000,
			engineer: 8000,
			factoryWorker: 5000,
			programmer: 6500,
			solarEngineer: 10000,
			swarmBot: 12000,
			singularityEngineer: 15000,
			voidMiner: 14000,
			realityArchitect: 20000,
			chronoEngineer: 25000,
		},

		yields: {
			baseHuntYield: 1,
			baseGatherYield: 1,
		},

		probabilities: {
			burnChance: 0.2,
			stoneChanceFromSticks: 0.3,
			furDropChance: 0.1,
			boneDropChance: 1.0,
			wolfAttackChance: 0.25,
			tinShortageChance: 0.3,
			conquestChance: 0.2,
			barbarianInvasionChance: 0.5,
			goldenAgeChance: 0.1,
			industrialAccidentChance: 0.25,
			exportBoomChance: 0.15,
		},

		workerBonuses: {
			fireControl: 0.5, // Reduces burn chance
			boneTools: 1, // Additional sticks/stones
			irrigation: 2, // Grain multiplier
			bronzeCasting: 2, // Bronze production
			blastFurnace: 2, // Steel multiplier
			steamEngine: 3, // Factory output
			quantumComputing: 10, // Data processing
		},

		gameVariables: {
			resourceEfficiency: 1.0,
			foodProduction: 1.0,
			populationGrowth: 1.0,
			researchSpeed: 1.0,
			tradeEfficiency: 1.0,
			productionSpeed: 1.0,
			militaryStrength: 1.0,
			defense: 1.0,
			happiness: 1.0,
			safety: 3.0,
			tradeRoutes: 0,
			entropy: 0,
		},

		resourceIcons: {
			// Basic Resources
			sticks: '🪵',
			stones: '🪨',
			rawMeat: '🥩',
			cookedMeat: '🍗',
			fur: '🟫',
			bones: '🦴',

			// Stone Age
			grain: '🌾',
			clay: '🏺',
			pottery: '⚱️',

			// Bronze Age
			copper: '🔶',
			tin: '🔹',
			bronze: '🔨',
			clayTablets: '📜',

			// Iron Age
			iron: '⚙️',
			steel: '🛠️',
			grainSurplus: '🌾🌾',

			// Industrial
			coal: '⛏️',
			steamParts: '💨',
			factoryGoods: '🏭',

			// Information Age
			silicon: '🔌',
			energy: '⚡',
			data: '💾',

			// Stellar
			solarPlasma: '☀️',
			dysonSwarm: '🛸',

			// Galactic
			darkMatter: '🌌',
			singularityCores: '🕳️',

			// Universal
			entropy: '🎲',
			cosmicStrings: '🌠',

			// Special
			population: '👥',
			defense: '🛡️',
			research: '📚',
		},

		progressionRequirements: {
			prehistoric: { population: 50 },
			stoneAge: { grain: 1000 },
			bronzeAge: { bronze: 200 },
			ironAge: { steel: 500 },
			industrialAge: { factoryGoods: 1000 },
			informationAge: { data: 5000 },
			stellarDominion: { dysonSwarm: 100 },
			galacticFederation: { darkMatter: 1e6 },
			universalAscendancy: { entropy: -100 },
		},
	};

	/**
	 * Manages all resource-related operations in the game.
	 * Handles resource gathering, processing, and worker production.
	 */
	class ResourceManager {
		/**
		 * Creates a new ResourceManager instance.
		 * @param {Object} state - The game state object
		 * @param {Function} updateProgressCallback - Callback for updating progression
		 * @param {Object} uiManager - The UI manager instance
		 */
		constructor(state, updateProgressCallback, uiManager) {
			this.state = state;
			this.updateProgress = updateProgressCallback;
			this.uiManager = uiManager;
		}

		/**
		 * Core resource gathering method used by all gathering operations.
		 * @param {string} resourceType - Type of resource to gather
		 * @param {number} baseYield - Base amount to gather
		 * @param {string} workerType - Type of worker performing the gathering
		 * @param {string} bonusKey - Key for any applicable bonuses
		 * @param {string} chanceKey - Key for probability checks
		 */
		gatherResource(resourceType, baseYield, workerType, bonusKey, chanceKey) {
			// Feed workers and calculate active workers
			let fedWorkers = 0;
			const workers = this.state.workers[workerType];
			for (let i = 0; i < workers; i++) {
				if (this.state.resources.cookedMeat >= 1) {
					this.state.resources.cookedMeat -= 1;
					fedWorkers++;
				}
			}
			this.state.workers[workerType] = fedWorkers;

			// Calculate total yield with bonuses
			const bonus = fedWorkers * (config.workerBonuses[bonusKey] || 0);
			const chanceBonus =
				chanceKey && Math.random() < (config.probabilities[chanceKey] || 0)
					? 1
					: 0;
			const efficiencyMultiplier = this.getEfficiencyMultiplier(resourceType);

			// Apply yield and update state
			this.state.resources[resourceType] +=
				(baseYield + bonus + chanceBonus) * efficiencyMultiplier;
			this.updateProgress(1);
			this.uiManager.updateUI();

			// Handle special cases for meat gathering
			if (resourceType === 'meat') {
				this.handleMeatGatheringExtras();
			}
		}

		/**
		 * Gets the efficiency multiplier for a resource type.
		 * @param {string} resourceType - The type of resource
		 * @returns {number} The efficiency multiplier
		 */
		getEfficiencyMultiplier(resourceType) {
			if (resourceType === 'meat') return config.gameVariables.meatProduction;
			if (resourceType === 'food') return config.gameVariables.foodProduction;
			return 1;
		}

		/**
		 * Handles additional resources from meat gathering (bones, fur).
		 */
		handleMeatGatheringExtras() {
			this.state.resources.bones = (this.state.resources.bones || 0) + 1;
			const furYield = Math.floor(Math.random() * 4);
			this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

			this.uiManager.showNotification(
				`You hunted and got 1 bone and ${furYield} fur!`,
				'success'
			);
		}

		/**
		 * Gathers resources based on the specified parameters.
		 * @param {string} resourceType - Type of resource to gather
		 * @param {number} baseYield - Base amount to gather
		 * @param {string} workerType - Type of worker performing the gathering
		 * @param {string} bonusKey - Key for any applicable bonuses
		 * @param {string} chanceKey - Key for probability checks
		 */
		gather(resourceType, baseYield, workerType, bonusKey, chanceKey = null) {
			this.gatherResource(
				resourceType,
				baseYield,
				workerType,
				bonusKey,
				chanceKey
			);

			if (resourceType === 'meat') {
				this.state.resources.bones = (this.state.resources.bones || 0) + 1;

				if (Math.random() < config.probabilities.furDropChance) {
					const furYield = Math.floor(Math.random() * 4) + 1;
					this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

					this.uiManager.showNotification(
						`You hunted and got 1 bone and ${furYield} fur!`,
						'success'
					);
				} else {
					this.uiManager.showNotification(
						`You hunted and got 1 bone but no fur this time.`,
						'info'
					);
				}
			}
		}

		/**
		 * Specialized method for gathering sticks with possible stone finds.
		 */
		gatherSticks() {
			this.gather(
				'sticks',
				1 + (this.state.upgrades.stickEfficiency || 0),
				'woodcutter',
				'workerBonusStick',
				'stoneChanceFromSticks'
			);
		}

		/**
		 * Specialized method for mining stones.
		 */
		mineStone() {
			this.gather(
				'stones',
				1 + (this.state.upgrades.stoneEfficiency || 0),
				'miner',
				'workerBonusStone'
			);
		}

		/**
		 * Specialized method for hunting animals.
		 */
		huntAnimal() {
			this.gather('meat', config.yields.huntYield, 'hunter', 'workerBonusMeat');
		}

		/**
		 * Crafts clothes from fur if resources are available.
		 */
		craftClothes() {
			const REQUIRED_FUR = 5;
			if (this.state.resources.fur >= REQUIRED_FUR) {
				this.state.resources.fur -= REQUIRED_FUR;
				this.state.resources.clothes = (this.state.resources.clothes || 0) + 1;
				this.uiManager.showNotification('You crafted clothes!', 'success');
			} else {
				this.uiManager.showNotification(
					'Not enough fur to craft clothes!',
					'error'
				);
			}
		}

		/**
		 * Applies clothing bonus to a worker type if available.
		 * @param {string} workerType - The type of worker to buff
		 */
		applyClothesToWorker(workerType) {
			if (
				this.state.resources.clothes > 0 &&
				this.state.workers[workerType] > 0
			) {
				this.state.resources.clothes -= 1;
				const bonusKey = `workerBonus${
				workerType.charAt(0).toUpperCase() + workerType.slice(1)
			}`;
				config.workerBonuses[bonusKey] *= 2;

				this.uiManager.showNotification(
					`${
					workerType.charAt(0).toUpperCase() + workerType.slice(1)
				} efficiency doubled!`,
					'success'
				);
			} else {
				this.uiManager.showNotification(
					'No clothes available or no workers to apply to!',
					'error'
				);
			}
		}

		/**
		 * Processes raw meat into cooked meat with possible burning.
		 */
		cookMeatClick() {
			if (this.state.resources.meat <= 0) {
				this.uiManager.showNotification('No raw meat to cook!', 'error');
				return;
			}

			const cookEfficiency = this.state.upgrades.cookEfficiency || 1;
			let cookedCount = this.processCooking(cookEfficiency);

			this.uiManager.showNotification(
				`You successfully cooked ${cookedCount} meat!`,
				'success'
			);
			this.updateProgress(1);
			this.uiManager.updateUI();
		}

		/**
		 * Processes a batch of cooking operations.
		 * @param {number} cookEfficiency - The cooking efficiency modifier
		 * @returns {number} The amount of successfully cooked meat
		 */
		processCooking(cookEfficiency) {
			let cookedCount = 0;

			// Manual cooking
			for (let i = 0; i < cookEfficiency && this.state.resources.meat > 0; i++) {
				if (this.attemptCooking()) cookedCount++;
			}

			// Worker cooking
			const cooks = this.state.workers.cook || 0;
			for (let i = 0; i < cooks && this.state.resources.meat > 0; i++) {
				if (this.attemptCooking()) cookedCount++;
			}

			return cookedCount;
		}

		/**
		 * Attempts to cook a single piece of meat.
		 * @returns {boolean} Whether the cooking was successful
		 */
		attemptCooking() {
			this.state.resources.meat -= 1;
			if (Math.random() >= config.probabilities.burnChance) {
				this.state.resources.cookedMeat += 1;
				return true;
			} else {
				this.uiManager.showNotification('A piece of meat burned!', 'warning');
				return false;
			}
		}

		/**
		 * Forages for sticks with a chance to find stones.
		 */
		forage() {
			const stickYield = 1 + (this.state.upgrades.stickEfficiency || 0); // Apply stick efficiency upgrade
			const stoneChance =
				Math.random() < config.probabilities.stoneChanceFromSticks; // Use centralized stone chance
			const stoneYield = stoneChance
				? 1 + (this.state.upgrades.stoneEfficiency || 0)
				: 0;

			this.state.resources.sticks += stickYield;
			if (stoneYield > 0) {
				this.state.resources.stones += stoneYield;
				this.uiManager.showNotification('You found a stone!', 'success', 1000);
			}

			this.uiManager.updateUI();
		}
	}

	const gameProgressionData = {
		eras: {
			prehistoric: {
				name: 'Prehistoric Era',
				dateRange: '2.5M BCE - 10,000 BCE',
				keyResources: ['sticks', 'stones', 'rawMeat', 'fur', 'bones'],
				keyFeatures: ['Basic stone tools', 'Hunting & gathering', 'Fire mastery'],
				workers: [
					{
						id: 'forager',
						name: 'Forager',
						cost: { meat: 3 },
						effect: { sticks: 1, stones: 0.3 },
					},
					{
						id: 'hunter',
						name: 'Hunter',
						cost: { sticks: 5 },
						effect: { rawMeat: 1, bones: 0.5 },
					},
					{
						id: 'cook',
						name: 'Cook',
						cost: { stones: 3 },
						effect: { cookedMeat: 1 },
					},
				],
				upgrades: [
					{
						id: 'fireControl',
						name: 'Fire Control',
						description: 'Reduces meat burning chance by 50%',
						cost: { sticks: 30, stones: 20 },
						effect: { burnChance: -0.5 },
						maxCount: 1,
					},
					{
						id: 'boneTools',
						name: 'Bone Tools',
						description: '+1 stick/stone per gather',
						cost: { bones: 15 },
						effect: { workerBonusStick: 1, workerBonusStone: 1 },
						maxCount: 1,
					},
				],
				events: [
					{
						name: 'Wolf Attack!',
						effect: 'Lose 1 hunter (25% chance)',
						trigger: { action: 'hunting', chance: 0.25 },
					},
				],
				transitionText:
					'Mastering fire and tools leads to settled communities...',
			},

			stoneAge: {
				name: 'Stone Age',
				dateRange: '10,000 BCE - 3,000 BCE',
				keyResources: ['grain', 'clay', 'pottery'],
				keyFeatures: [
					'Agriculture development',
					'Permanent settlements',
					'Domestication',
				],
				workers: [
					{
						id: 'farmer',
						name: 'Farmer',
						cost: { cookedMeat: 5 },
						effect: { grain: 2 },
					},
					{
						id: 'potter',
						name: 'Potter',
						cost: { clay: 3 },
						effect: { pottery: 1 },
					},
				],
				upgrades: [
					{
						id: 'irrigation',
						name: 'Irrigation',
						description: 'Double grain production',
						cost: { pottery: 5, sticks: 20 },
						effect: { grainMultiplier: 2 },
						maxCount: 1,
					},
				],
				transitionText: 'Farming surplus enables civilization...',
			},

			bronzeAge: {
				name: 'Bronze Age',
				dateRange: '3300 BCE - 1200 BCE',
				keyResources: ['copper', 'tin', 'bronze', 'clayTablets'],
				keyFeatures: [
					'Alloy metallurgy',
					'Early writing systems',
					'Trade networks',
				],
				workers: [
					{
						id: 'copperMiner',
						name: 'Copper Miner',
						cost: { tools: 2 },
						effect: { copper: 3 },
					},
					{
						id: 'tinTrader',
						name: 'Tin Trader',
						cost: { bronze: 1 },
						effect: { tin: 2 },
					},
					{
						id: 'scribe',
						name: 'Scribe',
						cost: { clayTablets: 1 },
						effect: { research: 0.5 },
					},
				],
				upgrades: [
					{
						id: 'bronzeCasting',
						name: 'Bronze Casting',
						description: '1 copper + 1 tin → 2 bronze',
						cost: { clayTablets: 5 },
						effect: { bronzeMultiplier: 2 },
						maxCount: 1,
					},
					{
						id: 'tradeRoutes',
						name: 'Trade Routes',
						description: 'Double tin acquisition',
						cost: { bronze: 20 },
						effect: { tinMultiplier: 2 },
						maxCount: 1,
					},
				],
				events: [
					{
						name: 'Tin Shortage',
						effect: 'Tin production halved for 1h',
						trigger: { resource: 'tin', chance: 0.3 },
					},
					{
						name: 'Conquest',
						effect: 'Gain 100 bronze instantly',
						trigger: { military: 3, chance: 0.2 },
					},
				],
				transitionText:
					'Mastery of metalworking forges the path to empire building...',
			},

			ironAge: {
				name: 'Iron Age',
				dateRange: '1200 BCE - 500 CE',
				keyResources: ['iron', 'steel', 'grainSurplus'],
				keyFeatures: [
					'Iron tools/weapons',
					'Empire expansion',
					'Currency systems',
				],
				workers: [
					{
						id: 'blacksmith',
						name: 'Blacksmith',
						cost: { iron: 5 },
						effect: { steel: 1 },
					},
					{
						id: 'farmer',
						name: 'Farmer',
						cost: { tools: 1 },
						effect: { grainSurplus: 3 },
					},
					{
						id: 'soldier',
						name: 'Soldier',
						cost: { steel: 2 },
						effect: { defense: 5 },
					},
				],
				upgrades: [
					{
						id: 'blastFurnace',
						name: 'Blast Furnace',
						description: 'Double steel production',
						cost: { iron: 100, coal: 50 },
						effect: { steelMultiplier: 2 },
						maxCount: 1,
					},
					{
						id: 'imperialRoads',
						name: 'Imperial Roads',
						description: '50% faster resource transport',
						cost: { stone: 500 },
						effect: { transportSpeed: 1.5 },
						maxCount: 1,
					},
				],
				events: [
					{
						name: 'Barbarian Invasion',
						effect: 'Lose 20% resources (50% chance)',
						trigger: {
							condition: 'defenseLessThan',
							threshold: 5,
							chance: 0.5,
						},
					},
					{
						name: 'Golden Age',
						effect: 'All production +25% for 2h',
						trigger: {
							condition: 'happinessGreaterThan',
							threshold: 80,
							chance: 0.1,
						},
					},
				],
				transitionText:
					'Iron mastery and imperial administration birth lasting civilizations...',
			},

			industrialAge: {
				name: 'Industrial Age',
				dateRange: '1760 CE - 1940 CE',
				keyResources: ['coal', 'steamParts', 'factoryGoods'],
				keyFeatures: ['Steam power', 'Mass production', 'Global trade'],
				workers: [
					{
						id: 'coalMiner',
						name: 'Coal Miner',
						cost: { tools: 5 },
						effect: { coal: 10 },
					},
					{
						id: 'engineer',
						name: 'Engineer',
						cost: { steel: 3 },
						effect: { steamParts: 2 },
					},
					{
						id: 'factoryWorker',
						name: 'Factory Worker',
						cost: { coal: 5 },
						effect: { factoryGoods: 4 },
					},
				],
				upgrades: [
					{
						id: 'steamEngine',
						name: 'Steam Engine',
						description: 'Triple factory output',
						cost: { steamParts: 50, iron: 200 },
						effect: { factoryOutput: 3 },
						maxCount: 1,
					},
					{
						id: 'railNetwork',
						name: 'Rail Network',
						description: 'Double trade efficiency',
						cost: { steel: 1000, coal: 500 },
						effect: { tradeEfficiency: 2 },
						maxCount: 1,
					},
				],
				events: [
					{
						name: 'Industrial Accident',
						effect: 'Lose 10% workers',
						trigger: {
							condition: 'safetyLessThan',
							threshold: 3,
							chance: 0.25,
						},
					},
					{
						name: 'Export Boom',
						effect: 'Double trade income for 24h',
						trigger: {
							condition: 'tradeRoutesGreaterThan',
							threshold: 5,
							chance: 0.15,
						},
					},
				],
				transitionText:
					'The roar of machinery propels humanity into the technological age...',
			},
			informationAge: {
				name: 'Information Age',
				dateRange: '1990 CE - 2040 CE',
				keyResources: ['silicon', 'energy', 'data'],
				keyFeatures: ['Global internet', 'Digital revolution', 'Early AI'],
				workers: [
					{
						id: 'programmer',
						name: 'Programmer',
						cost: { energy: 10 },
						effect: { data: 5 },
					},
					{
						id: 'engineer',
						name: 'Engineer',
						cost: { silicon: 3 },
						effect: { energy: 2 },
					},
				],
				upgrades: [
					{
						id: 'quantumComputing',
						name: 'Quantum Computing',
						description: '10x data processing',
						cost: { silicon: 100, energy: 500 },
						effect: { dataProcessing: 10 },
						maxCount: 1,
					},
				],
				transitionText: 'Digital networks connect humanity globally...',
			},

			stellarDominion: {
				name: 'Stellar Dominion (Type I)',
				dateRange: '2200 CE - 3000 CE',
				keyResources: ['solarPlasma', 'dysonSwarm'],
				keyFeatures: [
					'Dyson sphere construction',
					'Planetary engineering',
					'Star harvesting',
				],
				workers: [
					{
						id: 'solarEngineer',
						name: 'Solar Engineer',
						cost: { energy: 1000 },
						effect: { solarPlasma: 10 },
					},
					{
						id: 'swarmBot',
						name: 'Swarm Bot',
						cost: { solarPlasma: 50 },
						effect: { dysonSwarm: 1 },
					},
				],
				upgrades: [
					{
						id: 'fusionContainment',
						name: 'Fusion Containment',
						description: 'Double plasma yield',
						cost: { dysonSwarm: 5 },
						effect: { plasmaYield: 2 },
						maxCount: 1,
					},
				],
				transitionText:
					"Harnessing a star's full energy enables galactic expansion...",
			},

			galacticFederation: {
				name: 'Galactic Federation (Type II)',
				dateRange: '3000 CE - 10,000 CE',
				keyResources: ['darkMatter', 'singularityCores'],
				keyFeatures: [
					'Black hole engineering',
					'Galactic civilization',
					'Matter transmutation',
				],
				workers: [
					{
						id: 'singularityEngineer',
						name: 'Singularity Engineer',
						cost: { darkMatter: 1 },
						effect: { singularityCores: 0.1 },
					},
					{
						id: 'voidMiner',
						name: 'Void Miner',
						cost: { singularityCores: 1 },
						effect: { darkMatter: 5 },
					},
				],
				transitionText:
					'Mastering galactic resources unlocks universal control...',
			},

			universalAscendancy: {
				name: 'Universal Ascendancy (Type III)',
				dateRange: '10,000 CE+',
				keyResources: ['entropy', 'cosmicStrings'],
				keyFeatures: [
					'Multiverse travel',
					'Entropy reversal',
					'Reality engineering',
				],
				workers: [
					{
						id: 'realityArchitect',
						name: 'Reality Architect',
						cost: { cosmicStrings: 1 },
						effect: { entropy: -0.1 },
					},
					{
						id: 'chronoEngineer',
						name: 'Chrono Engineer',
						cost: { entropy: 10 },
						effect: { cosmicStrings: 1 },
					},
				],
				transitionText:
					'Transcending spacetime itself, humanity becomes eternal...',
			},
		},
		progressionRequirements: {
			prehistoric: { population: 50 },
			stoneAge: { grain: 1000 },
			stellarDominion: { dysonSwarm: 100 },
			galacticFederation: { darkMatter: 1e6 },
			universalAscendancy: { entropy: -100 }, // Negative entropy = order creation
		}};

	class UIManager {
		constructor(state, gameManager) {
			this.state = state;
			this.gameManager = gameManager;
			this.cacheElements();
			this.addEventListeners();
			this.initLogMenu();
		}

		cacheElements() {
			this.elements = {
				forageButton: document.getElementById('forage-button'),
				huntButton: document.getElementById('hunt-button'),
				cookButton: document.getElementById('cook-button'),
				resourceDisplay: document.getElementById('resource-display'),
				upgradesContainer: document.getElementById('upgrades'), // For upgrades
				itemsContainer: document.getElementById('items'), // Add a new container for items
				eraDisplay: document.getElementById('era-display'),
				hireButtons: {
					woodcutter: document.getElementById('hire-woodcutter'),
					miner: document.getElementById('hire-miner'),
					hunter: document.getElementById('hire-hunter'),
					cook: document.getElementById('hire-cook'),
				},
				workerStatus: document.getElementById('worker-status'),
				logMenu: document.getElementById('log-menu'),
				logToggle: document.getElementById('log-toggle'),
				eventLog: document.getElementById('event-log'),
				disasterLog: document.getElementById('disaster-log'),
				notificationContainer: document.getElementById('notification-container'),
				eraDetails: document.getElementById('era-details'), // Add this line
			};
		}

		addEventListeners() {
			this.elements.forageButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.forageButton,
					() => this.gameManager.resourceManager.forage(),
					100
				)
			);
			this.elements.huntButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.huntButton,
					() => this.gameManager.findFood(),
					120
				)
			);
			this.elements.cookButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.cookButton,
					() => this.gameManager.resourceManager.cookMeatClick(),
					80
				)
			);
			Object.entries(this.elements.hireButtons).forEach(([type, button]) =>
				button.addEventListener('click', () => this.gameManager.hireWorker(type))
			);
			this.elements.logToggle.addEventListener('click', () => {
				this.elements.logMenu.classList.toggle('collapsed');
			});
		}

		initLogMenu() {
			this.elements.logMenu.classList.add('collapsed'); // Start collapsed
		}

		updateUI() {
			this.updateResources();
			this.updateEraDisplay();

			const eraData = gameProgressionData.eras[this.state.age];
			const elements = [...(eraData?.upgrades || []), ...(eraData?.items || [])];
			this.renderElements(
				elements,
				this.elements.upgradesContainer,
				'upgrade-item'
			);

			this.updateButtons();
			this.updateWorkerStatus();
		}

		updateResources() {
			this.elements.resourceDisplay.innerHTML = Object.entries(
				this.state.resources
			)
				.filter(([_, val]) => val > 0) // Only display resources with a value greater than 0
				.map(
					([key, val]) =>
						`<div class="resource">${
						config.resourceIcons[key] || key
					} ${Math.floor(val)}</div>` // Use config for icons
				)
				.join('');
		}

		updateEraDisplay() {
			this.elements.eraDisplay.textContent = `Era: ${
			this.gameManager.eraData[this.state.age]?.name || 'Unknown'
		}`;
		}

		updateEraDetails(era) {
			this.elements.eraDetails.innerHTML = `
			<h2>${era.name}</h2>
			<p>${era.dateRange}</p>
			<ul>
				${era.keyFeatures.map((feature) => `<li>${feature}</li>`).join('')}
			</ul>
		`;
		}

		updateButtons() {
			const eraData = gameProgressionData.eras[this.state.age];
			this.elements.huntButton.classList.toggle(
				'hidden',
				!this.state.upgrades[
					eraData.upgrades.find((u) => u.id === 'fireControl')?.effect
						?.unlockFeature
				]
			);
			this.elements.cookButton.classList.toggle(
				'hidden',
				!this.state.upgrades[
					eraData.upgrades.find((u) => u.id === 'fireControl')?.effect
						?.unlockFeature
				]
			);
			Object.entries(this.elements.hireButtons).forEach(([type, button]) => {
				const worker = eraData.workers.find((w) => w.id === type);
				button.textContent = `Hire ${worker.name} (${this.formatCost(
				worker.cost
			)})`;
			});
			this.elements.logToggle.style.display = 'block';
		}

		updateWorkerStatus() {
			this.elements.workerStatus.textContent = Object.entries(this.state.workers)
				.map(
					([type, count]) =>
						`${type.charAt(0).toUpperCase() + type.slice(1)}s: ${count || 0}`
				)
				.join(', ');
		}

		renderElements(elements, container, type) {
			container.innerHTML = '';
			if (!elements) return;

			elements.forEach((element) => {
				const currentCount = this.state.upgrades[`${element.id}_count`] || 0;
				const remainingCount = element.maxCount
					? element.maxCount - currentCount
					: Infinity;
				const canAfford = this.gameManager.canAfford(element.cost);

				const elementEl = document.createElement('div');
				elementEl.className = `upgrade-item ${
				remainingCount <= 0 ? 'maxed-out' : canAfford ? 'available' : 'locked'
			}`;
				elementEl.innerHTML = `
				<h3>${element.name}</h3>
				<p>${element.description}</p>
				<div>Cost: ${this.formatCost(element.cost)}</div>
				<div>Remaining: ${remainingCount}</div>
				<button ${remainingCount <= 0 ? 'disabled' : ''} class="${
				remainingCount <= 0 ? 'maxed' : canAfford ? 'buyable' : 'unaffordable'
			}">
					${remainingCount <= 0 ? 'Maxed Out' : 'Buy'}
				</button>
			`;
				elementEl.querySelector('button').addEventListener('click', () => {
					if (type === 'upgrade-item') {
						this.gameManager.buyUpgrade(element.id);
					} else {
						this.gameManager.buyItem(element.id);
					}
				});
				container.appendChild(elementEl);
			});
		}

		formatCost(cost) {
			return Object.entries(cost)
				.map(
					([resource, amount]) =>
						`${amount} ${config.resourceIcons[resource] || resource}` // Use config for icons
				)
				.join(', ');
		}

		getIcon(resource) {
			return config.resourceIcons[resource] || resource; // Use centralized icons
		}

		logEvent(event) {
			const logEntry = document.createElement('div');
			logEntry.className = 'log-entry';
			logEntry.innerHTML = `
			<h4>${event.name}</h4>
			<p>${event.impact}</p>
			<p>Effect: ${event.effect}</p>
		`;
			this.elements.eventLog.appendChild(logEntry);
			this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight; // Auto-scroll to the latest log
		}

		logDisaster(disaster) {
			const logEntry = document.createElement('div');
			logEntry.className = 'log-entry';
			logEntry.innerHTML = `
			<h4>${disaster.name}</h4>
			<p>${disaster.impact}</p>
			<p>Effect: ${disaster.effect}</p>
		`;
			this.elements.disasterLog.appendChild(logEntry);
			this.elements.disasterLog.scrollTop =
				this.elements.disasterLog.scrollHeight; // Auto-scroll to the latest log
		}

		showNotification(message, type = 'success', duration = 2000) {
			const notification = document.createElement('div');
			notification.className = `notification ${type}`;
			notification.textContent = message;

			this.elements.notificationContainer.appendChild(notification);

			// Remove the notification after the specified duration
			setTimeout(() => {
				notification.remove();
			}, duration);
		}

		updateWorkerProgress(workerType, duration, totalDuration) {
			let progressBar = document.querySelector(`#${workerType}-progress`);
			if (!progressBar) {
				// Create a new progress bar if it doesn't exist
				progressBar = document.createElement('div');
				progressBar.id = `${workerType}-progress`;
				progressBar.className = 'worker-progress-bar';
				this.elements.workerStatus.appendChild(progressBar);
			}

			// Update the progress bar's width and animation
			progressBar.style.transition = `width ${duration}ms linear`;
			progressBar.style.width = `${(duration / totalDuration) * 100}%`;

			// Remove the progress bar when the task is complete
			if (duration === 0) {
				setTimeout(() => progressBar.remove(), totalDuration);
			}
		}
	}

	class WorkerManager {
		constructor(state, uiManager, updateUI) {
			this.state = state;
			this.uiManager = uiManager;
			this.updateUI = updateUI;
			this.workerIntervals = {};
		}

		startWorkerTask(workerType, resourceType, baseYield, bonusKey) {
			if (this.workerIntervals[workerType]) {
				clearInterval(this.workerIntervals[workerType]);
			}
			const baseTimer = config.workerTimers[workerType];
			const timer = Math.max(
				1000,
				baseTimer * (1 - (this.state.upgrades.efficiency || 0) * 0.1)
			);

			// Create or update the progress bar for this worker type
			this.uiManager.updateWorkerProgress(workerType, 0, timer);

			this.workerIntervals[workerType] = setInterval(() => {
				this.performWorkerAction(workerType, resourceType, baseYield, bonusKey);

				// Reset the progress bar after each action
				this.uiManager.updateWorkerProgress(workerType, 0, timer);
			}, timer);

			// Start the progress bar animation
			this.uiManager.updateWorkerProgress(workerType, timer, timer);
		}

		performWorkerAction(workerType, resourceType, baseYield, bonusKey) {
			let totalYield = 0;
			let unfedWorkers = 0;

			for (let i = 0; i < this.state.workers[workerType]; i++) {
				if (this.state.resources.cookedMeat >= 1) {
					this.state.resources.cookedMeat--;
					totalYield += baseYield + (config.workerBonuses[bonusKey] || 0);
				} else if (resourceType === 'bones' && this.state.resources.bones >= 1) {
					this.state.resources.bones--; // Deduct bones if used as a resource
					totalYield += baseYield;
				} else if (resourceType === 'fur' && this.state.resources.fur >= 1) {
					this.state.resources.fur--; // Deduct fur if used as a resource
					totalYield += baseYield;
				} else {
					unfedWorkers++;
				}
			}

			if (unfedWorkers > 0) {
				this.uiManager.showNotification(
					`${unfedWorkers} ${workerType}(s) couldn't work due to lack of food.`,
					'error'
				);
			}

			this.state.resources[resourceType] += totalYield;
			this.updateUI();
		}

		startAllWorkerTasks() {
			this.startWorkerTask('woodcutter', 'sticks', 1, 'workerBonusStick');
			this.startWorkerTask('miner', 'stones', 1, 'workerBonusStone');
			this.startWorkerTask(
				'hunter',
				'meat',
				config.yields.huntYield,
				'workerBonusMeat'
			);
			this.startWorkerTask('cook', 'cookedMeat', 2, 'workerBonusCook');
		}

		getWorkerCost(workerType) {
			const worker = gameProgressionData.eras[this.state.age].workers.find(
				(w) => w.id === workerType
			);
			const multiplier = 1.5;
			const workerCount = this.state.workers[workerType] || 0;

			const cost = {};
			Object.entries(worker.cost).forEach(([resource, amount]) => {
				cost[resource] = Math.ceil(amount * Math.pow(multiplier, workerCount));
			});
			return cost;
		}

		hireWorker(workerType) {
			const cost = this.getWorkerCost(workerType);

			// Check if the player can afford the worker
			const canAfford = Object.entries(cost).every(
				([resource, amount]) => this.state.resources[resource] >= amount
			);

			if (canAfford) {
				// Deduct the resources
				Object.entries(cost).forEach(([resource, amount]) => {
					this.state.resources[resource] -= amount;
				});

				// Increment the worker count
				this.state.workers[workerType] =
					(this.state.workers[workerType] || 0) + 1;

				// Start or update the automated task for the worker
				this.startWorkerTask(workerType, resourceType, baseYield, bonusKey);

				// Update the UI
				this.updateUI();
			}
		}

		triggerWorkerAction(workerType, resourceType, baseYield, bonusKey) {
			this.performWorkerAction(workerType, resourceType, baseYield, bonusKey);
		}
	}

	/**
	 * Manages the overall game state, progression, and interactions.
	 * Handles resources, workers, upgrades, events, disasters, and era transitions.
	 */
	class GameManager {
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

	/**
	 * Manages the cutscene flow and transitions between scenes or eras.
	 * Handles auto-progression, manual progression, and era transitions.
	 */
	class CutsceneManager {
		constructor() {
			// Select all cutscene elements
			this.scenes = document.querySelectorAll('.scene');
			this.currentSceneIndex = 0; // Tracks the current scene index
			this.autoProgressTimer = null; // Timer for auto-progression
			this.init(); // Initialize the cutscene manager
		}

		/**
		 * Initializes the cutscene manager by showing the first scene
		 * and setting up event listeners for progression.
		 */
		init() {
			this.showScene(0); // Display the first scene

			// Add click event listeners to all "next" buttons in scenes
			document.querySelectorAll('.scene-next').forEach((button) => {
				button.addEventListener('click', () => this.nextScene());
			});

			this.startAutoProgress(); // Start auto-progression for scenes
		}

		/**
		 * Displays a specific scene by index and hides all others.
		 * @param {number} index - The index of the scene to display.
		 */
		showScene(index) {
			this.scenes.forEach((scene, i) => {
				scene.classList.toggle('active', i === index); // Show only the active scene
			});
			this.currentSceneIndex = index; // Update the current scene index
			this.updateProgressBar(); // Update the progress bar
		}

		/**
		 * Updates the progress bar to reflect the current scene's position.
		 */
		updateProgressBar() {
			const progress = ((this.currentSceneIndex + 1) / this.scenes.length) * 100;
			document.documentElement.style.setProperty(
				'--progress-width',
				`${progress}%`
			);
		}

		/**
		 * Advances to the next scene. If the last scene is reached, ends the cutscene.
		 */
		nextScene() {
			if (this.currentSceneIndex < this.scenes.length - 1) {
				this.showScene(this.currentSceneIndex + 1); // Show the next scene
				this.resetAutoProgress(); // Reset auto-progression timer
			} else {
				this.endCutscene(); // End the cutscene if it's the last scene
			}
		}

		/**
		 * Starts auto-progression for scenes, advancing to the next scene after a delay.
		 */
		startAutoProgress() {
			this.autoProgressTimer = setInterval(() => this.nextScene(), 10000); // 10 seconds per scene
		}

		/**
		 * Resets the auto-progression timer and restarts it.
		 */
		resetAutoProgress() {
			clearInterval(this.autoProgressTimer); // Clear the existing timer
			this.startAutoProgress(); // Restart auto-progression
		}

		/**
		 * Ends the cutscene, hides the cutscene container, and shows the game UI.
		 * Initializes the game if it hasn't been started yet.
		 */
		endCutscene() {
			clearInterval(this.autoProgressTimer); // Stop auto-progression
			document.getElementById('cutscene-container').classList.add('hidden'); // Hide cutscene
			document.getElementById('game-container').classList.remove('hidden'); // Show game UI

			// Initialize the game if it hasn't been started
			if (!window.game) {
				window.game = new GameManager();
			}
		}

		/**
		 * Triggers a cutscene for transitioning between eras.
		 * Displays a custom transition message and resets the cutscene flow.
		 * @param {Object} era - The era data containing the name and transition text.
		 */
		triggerEraCutscene(era) {
			const cutsceneContainer = document.getElementById('cutscene-container');
			cutsceneContainer.innerHTML = `
			<div class="scene active">
				<h1>${era.name} Transition</h1>
				<p>${era.transitionText}</p>
				<button class="scene-next">▶️ Continue</button>
			</div>
		`;
			cutsceneContainer.classList.remove('hidden'); // Show the cutscene container
			document.getElementById('game-container').classList.add('hidden'); // Hide the game UI
			this.init(); // Reinitialize the cutscene manager
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		new CutsceneManager();
	});

})();
