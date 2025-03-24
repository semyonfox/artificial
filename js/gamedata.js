export const gameProgressionData = {
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
	},
	globalEvents: [
		{
			name: 'Technological Singularity',
			triggerEra: 'informationAge',
			effect: 'All research speeds 10x',
		},
		{
			name: 'Vacuum Decay',
			triggerEra: 'universalAscendancy',
			effect: 'Reset all progress (1% chance/hour)',
		},
	],
};
