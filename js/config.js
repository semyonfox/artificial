// config.js
export const config = {
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
