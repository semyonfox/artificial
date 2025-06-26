/**
 * Central configuration file for the Evolution Clicker game
 * Contains historically accurate era data and configurable values
 */

export const config = {
	// Resource display icons organized by historical era
	resourceIcons: {
		// Paleolithic Era (2.6M - 10K BCE) - Hunter-Gatherer Society
		sticks: '🪵',
		stones: '🪨',
		meat: '🥩',
		cookedMeat: '🍗',
		bones: '🦴',
		fur: '�',
		fire: '🔥',

		// Neolithic Era (10K - 3.3K BCE) - Agricultural Revolution
		grain: '🌾',
		clay: '🏺',
		pottery: '⚱️',
		livestock: '🐄',
		textiles: '🧶',
		tools: '🔧',

		// Bronze Age (3300 - 1200 BCE) - First Metal Working
		copper: '🔶',
		tin: '🔹',
		bronze: '🔨',
		wheel: '⚙️',
		writing: '📜',
		trade: '💰',

		// Iron Age (1200 - 600 BCE) - Iron Working & Early Civilizations
		iron: '⚙️',
		steel: '🛠️',
		coins: '🪙',
		roads: '🛤️',
		cities: '🏛️',
		knowledge: '📚',

		// Classical Era (600 BCE - 500 CE) - Greece, Rome, etc.
		engineering: '🏗️',
		aqueducts: '💧',
		philosophy: '🤔',
		mathematics: '📐',
		medicine: '⚕️',
		art: '🎨',

		// Medieval Era (500 - 1000 CE) - Middle Ages
		agriculture: '🌱',
		mills: '🏗️',
		guilds: '👥',
		manuscripts: '📖',
		castles: '🏰',
		religion: '⛪',

		// Renaissance (1000 - 1500 CE) - Scientific Revolution
		printing: '📰',
		exploration: '🧭',
		banking: '🏦',
		gunpowder: '💥',
		optics: '🔭',
		navigation: '⛵',

		// Industrial Age (1760 - 1840) - Steam Power
		coal: '⛏️',
		steam: '💨',
		factories: '🏭',
		railways: '🚂',
		electricity: '⚡',
		steel: '🔩',

		// Information Age (1950 - 2020) - Digital Revolution
		silicon: '🔌',
		computers: '💻',
		data: '💾',
		internet: '🌐',
		satellites: '🛰️',
		software: '�',

		// Space Age (2020 - 2100) - Solar System Colonization
		rockets: '🚀',
		solarPanels: '☀️',
		robotics: '🤖',
		fusion: '⚛️',
		spaceStations: '🛸',
		terraforming: '🌍',

		// Galactic Era (2100+) - Interstellar Civilization
		antimatter: '⚛️',
		darkMatter: '🌌',
		wormholes: '🕳️',
		dysonSpheres: '☀️',
		quantumComputers: '🧠',
		timeManipulation: '⏰',

		// Universal Era (Far Future) - Reality Manipulation
		multiverseAccess: '🌀',
		realityEngines: '�',
		consciousnessTransfer: '👁️',
		universalConstants: '🎲',
		existentialEnergy: '✨',
		cosmicStrings: '🌠',

		// Special Resources
		population: '👥',
		defense: '🛡️',
		research: '📚',
	},

	// Era definitions with historical periods
	eras: {
		paleolithic: {
			name: 'Paleolithic Era',
			timespan: '2.6M - 10K BCE',
			description:
				"The Old Stone Age - humanity's longest period, characterized by hunter-gatherer societies and the first use of stone tools.",
		},
		neolithic: {
			name: 'Neolithic Era',
			timespan: '10K - 3.3K BCE',
			description:
				'The New Stone Age - the Agricultural Revolution begins, leading to permanent settlements and domestication.',
		},
		bronze: {
			name: 'Bronze Age',
			timespan: '3300 - 1200 BCE',
			description:
				'First metal working civilizations emerge, with bronze tools and weapons revolutionizing society.',
		},
		iron: {
			name: 'Iron Age',
			timespan: '1200 - 600 BCE',
			description:
				'Iron working spreads, creating stronger tools and weapons, leading to the rise of great empires.',
		},
		classical: {
			name: 'Classical Era',
			timespan: '600 BCE - 500 CE',
			description:
				'The height of ancient civilizations like Greece and Rome, with advances in philosophy, science, and engineering.',
		},
		medieval: {
			name: 'Medieval Era',
			timespan: '500 - 1000 CE',
			description:
				'The Middle Ages, characterized by feudalism, religious influence, and gradual technological progress.',
		},
		renaissance: {
			name: 'Renaissance',
			timespan: '1000 - 1500 CE',
			description:
				'A period of cultural and scientific rebirth, with major advances in art, science, and exploration.',
		},
		industrial: {
			name: 'Industrial Age',
			timespan: '1760 - 1840',
			description:
				'The Industrial Revolution transforms society with steam power, factories, and mass production.',
		},
		information: {
			name: 'Information Age',
			timespan: '1950 - 2020',
			description:
				'The Digital Revolution brings computers, the internet, and global connectivity.',
		},
		space: {
			name: 'Space Age',
			timespan: '2020 - 2100',
			description:
				'Humanity expands beyond Earth, colonizing the solar system with advanced technology.',
		},
		galactic: {
			name: 'Galactic Era',
			timespan: '2100+',
			description:
				'Interstellar civilization emerges with faster-than-light travel and exotic physics.',
		},
		universal: {
			name: 'Universal Era',
			timespan: 'Far Future',
			description:
				'Transcendent beings capable of manipulating reality itself across multiple universes.',
		},
	},

	// Historical events and disasters by era
	events: {
		paleolithic: [
			{
				type: 'disaster',
				name: 'Ice Age',
				description: 'Harsh winters reduce food availability',
				effect: { meat: -0.5, fur: +0.2 },
			},
			{
				type: 'discovery',
				name: 'Cave Paintings',
				description: 'Early artistic expression discovered',
				effect: { population: +0.1 },
			},
			{
				type: 'breakthrough',
				name: 'Tool Making',
				description: 'Better stone tool techniques developed',
				effect: { stones: +0.3 },
			},
		],
		neolithic: [
			{
				type: 'disaster',
				name: 'Crop Failure',
				description: 'Poor harvest threatens settlement',
				effect: { grain: -0.4, population: -0.1 },
			},
			{
				type: 'discovery',
				name: 'Animal Domestication',
				description: 'Livestock provide steady resources',
				effect: { livestock: +0.5, meat: +0.2 },
			},
			{
				type: 'breakthrough',
				name: 'Pottery Wheel',
				description: 'Mass production of clay vessels',
				effect: { pottery: +0.4 },
			},
			{
				type: 'disaster',
				name: 'Drought',
				description: 'Extended dry period affects crops',
				effect: { grain: -0.3, livestock: -0.2 },
			},
			{
				type: 'discovery',
				name: 'Weaving Techniques',
				description: 'Advanced textile production methods',
				effect: { textiles: +0.6 },
			},
		],
		bronze: [
			{
				type: 'disaster',
				name: 'Bronze Age Collapse',
				description: 'Mysterious societal collapse',
				effect: { trade: -0.6, cities: -0.3 },
			},
			{
				type: 'discovery',
				name: 'Written Language',
				description: 'Complex writing systems developed',
				effect: { writing: +0.5, knowledge: +0.3 },
			},
			{
				type: 'breakthrough',
				name: 'The Wheel',
				description: 'Revolutionary transportation technology',
				effect: { trade: +0.4, wheel: +1.0 },
			},
			{
				type: 'disaster',
				name: 'Trade Route Collapse',
				description: 'Important trade connections severed',
				effect: { bronze: -0.4, trade: -0.5 },
			},
			{
				type: 'discovery',
				name: 'Mathematics',
				description: 'Numerical systems and geometry',
				effect: { knowledge: +0.7, writing: +0.2 },
			},
		],
		iron: [
			{
				type: 'disaster',
				name: 'War and Conquest',
				description: 'Military conflicts devastate regions',
				effect: { population: -0.3, cities: -0.4 },
			},
			{
				type: 'discovery',
				name: 'Philosophy',
				description: 'Systematic thinking about existence',
				effect: { knowledge: +0.8, philosophy: +0.5 },
			},
			{
				type: 'breakthrough',
				name: 'Engineering Marvels',
				description: 'Advanced construction techniques',
				effect: { engineering: +0.6, cities: +0.3 },
			},
			{
				type: 'disaster',
				name: 'Plague Outbreak',
				description: 'Disease spreads through cities',
				effect: { population: -0.5, cities: -0.2 },
			},
			{
				type: 'discovery',
				name: 'Currency System',
				description: 'Standardized money for trade',
				effect: { trade: +0.7, coins: +0.4 },
			},
		],
		industrial: [
			{
				type: 'disaster',
				name: 'Factory Fire',
				description: 'Industrial accident damages production',
				effect: { factories: -0.3, steam: -0.2 },
			},
			{
				type: 'discovery',
				name: 'Electricity',
				description: 'Harnessing electrical power',
				effect: { electricity: +0.6, factories: +0.3 },
			},
			{
				type: 'breakthrough',
				name: 'Steam Engine',
				description: 'Steam power revolutionizes industry',
				effect: { steam: +0.8, railways: +0.4 },
			},
			{
				type: 'disaster',
				name: 'Economic Depression',
				description: 'Financial crisis halts progress',
				effect: { factories: -0.4, railways: -0.3 },
			},
			{
				type: 'discovery',
				name: 'Telegraph',
				description: 'Long-distance communication',
				effect: { electricity: +0.5, railways: +0.2 },
			},
		],
		information: [
			{
				type: 'disaster',
				name: 'System Crash',
				description: 'Major computer systems fail',
				effect: { data: -0.4, computers: -0.2 },
			},
			{
				type: 'discovery',
				name: 'Internet',
				description: 'Global information network created',
				effect: { internet: +0.7, data: +0.5 },
			},
			{
				type: 'breakthrough',
				name: 'Microprocessor',
				description: 'Computers become widely accessible',
				effect: { silicon: +0.6, computers: +0.8 },
			},
			{
				type: 'disaster',
				name: 'Cyber Attack',
				description: 'Malicious software damages networks',
				effect: { internet: -0.3, data: -0.5 },
			},
			{
				type: 'discovery',
				name: 'Artificial Intelligence',
				description: 'Machine learning breakthroughs',
				effect: { software: +1.0, data: +0.8 },
			},
		],
	},

	// Worker automation timers (in milliseconds)
	workerTimers: {
		gatherer: 8000,
		hunter: 12000,
		cook: 6000,
		craftsman: 10000,
		farmer: 15000,
		miner: 12000,
		scholar: 20000,
		engineer: 25000,
	},

	// Base resource yields
	yields: {
		huntYield: 2,
		forageYield: 1,
		stickYield: 1,
		stoneYield: 1,
	},

	// Probability values for random events
	probabilities: {
		burnChance: 0.35,
		stoneChanceFromSticks: 0.2,
		furDropChance: 0.6,
		eventChance: 0.1, // 10% chance per minute for random events
		disasterChance: 0.05, // 5% chance for disasters
	},

	// Game balance variables
	gameVariables: {
		meatProduction: 1,
		foodProduction: 1,
		workerFoodConsumption: 1,
		researchSpeed: 1,
		populationGrowth: 1,
	},

	// UI configuration
	ui: {
		notificationDuration: 3000,
		progressAnimationSpeed: 200,
	},

	// Save/load settings
	storage: {
		saveKey: 'evolutionClickerSave',
		autoSaveInterval: 30000, // 30 seconds
	},

	// Worker bonuses and efficiency multipliers
	workerBonuses: {
		gathering: 0.5,
		hunting: 0.8,
		cooking: 0.3,
		farming: 1.0,
		crafting: 0.7,
		scholarly: 1.2,
		engineering: 1.5,
	},

	// Resource efficiency multipliers by upgrade
	efficiencyMultipliers: {
		sticks: {
			stoneKnapping: 1.2,
			boneTools: 1.5,
			shelterBuilding: 1.3,
		},
		stones: {
			stoneKnapping: 1.5,
			boneTools: 1.8,
		},
		meat: {
			stoneKnapping: 2.0,
			boneTools: 2.5,
			furClothing: 1.3,
		},
		grain: {
			agriculture: 2.0,
			tools: 1.5,
			pottery: 1.2,
		},
		bronze: {
			bronzeWorking: 2.0,
			wheel: 1.3,
			mathematics: 1.2,
		},
	},

	// Game balance constants
	balance: {
		basePopulationGrowth: 0.001,
		maxPopulationPerEra: {
			paleolithic: 50,
			neolithic: 200,
			bronze: 1000,
			iron: 5000,
			industrial: 50000,
			information: 500000,
		},
		workerEfficiency: {
			wellFed: 1.0,
			hungry: 0.5,
			starving: 0.1,
		},
		eraProgressionRequirements: {
			populationMultiplier: 1.5,
			resourceDiversity: 0.7,
			upgradeCompletion: 0.6,
		},
	},
};
