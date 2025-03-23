export const gameProgressionData = {
	eras: {
		prehistoric: {
			name: 'Prehistoric Era',
			dateRange: '2.5M BCE - 10,000 BCE',
			keyResources: ['sticks', 'stones', 'rawMeat', 'fur', 'bones'],
			keyFeatures: ['Basic stone tools', 'Hunting & gathering', 'Fire mastery'],
			workers: {
				forager: { cost: { meat: 3 }, effect: { sticks: 1, stones: 0.3 } },
				hunter: { cost: { sticks: 5 }, effect: { rawMeat: 1, bones: 0.5 } },
				cook: { cost: { stones: 3 }, effect: { cookedMeat: 1 } },
			},
			upgrades: [
				{
					name: 'Fire Control',
					effect: 'Reduces meat burning chance by 50%',
					cost: { sticks: 30, stones: 20 },
				},
				{
					name: 'Bone Tools',
					effect: '+1 stick/stone per gather',
					cost: { bones: 15 },
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
			workers: {
				farmer: { cost: { cookedMeat: 5 }, effect: { grain: 2 } },
				potter: { cost: { clay: 3 }, effect: { pottery: 1 } },
			},
			upgrades: [
				{
					name: 'Irrigation',
					effect: 'Double grain production',
					cost: { pottery: 5, sticks: 20 },
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
			workers: {
				copperMiner: { cost: { tools: 2 }, effect: { copper: 3 } },
				tinTrader: { cost: { bronze: 1 }, effect: { tin: 2 } },
				scribe: { cost: { clayTablets: 1 }, effect: { research: 0.5 } },
			},
			upgrades: [
				{
					name: 'Bronze Casting',
					effect: '1 copper + 1 tin → 2 bronze',
					cost: { clayTablets: 5 },
				},
				{
					name: 'Trade Routes',
					effect: 'Double tin acquisition',
					cost: { bronze: 20 },
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
			workers: {
				blacksmith: { cost: { iron: 5 }, effect: { steel: 1 } },
				farmer: { cost: { tools: 1 }, effect: { grainSurplus: 3 } },
				soldier: { cost: { steel: 2 }, effect: { defense: 5 } },
			},
			upgrades: [
				{
					name: 'Blast Furnace',
					effect: 'Double steel production',
					cost: { iron: 100, coal: 50 },
				},
				{
					name: 'Imperial Roads',
					effect: '50% faster resource transport',
					cost: { stone: 500 },
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
			workers: {
				coalMiner: { cost: { tools: 5 }, effect: { coal: 10 } },
				engineer: { cost: { steel: 3 }, effect: { steamParts: 2 } },
				factoryWorker: { cost: { coal: 5 }, effect: { factoryGoods: 4 } },
			},
			upgrades: [
				{
					name: 'Steam Engine',
					effect: 'Triple factory output',
					cost: { steamParts: 50, iron: 200 },
				},
				{
					name: 'Rail Network',
					effect: 'Double trade efficiency',
					cost: { steel: 1000, coal: 500 },
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
			workers: {
				programmer: { cost: { energy: 10 }, effect: { data: 5 } },
				engineer: { cost: { silicon: 3 }, effect: { energy: 2 } },
			},
			upgrades: [
				{
					name: 'Quantum Computing',
					effect: '10x data processing',
					cost: { silicon: 100, energy: 500 },
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
			workers: {
				solarEngineer: { cost: { energy: 1000 }, effect: { solarPlasma: 10 } },
				swarmBot: { cost: { solarPlasma: 50 }, effect: { dysonSwarm: 1 } },
			},
			upgrades: [
				{
					name: 'Fusion Containment',
					effect: 'Double plasma yield',
					cost: { dysonSwarm: 5 },
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
			workers: {
				singularityEngineer: {
					cost: { darkMatter: 1 },
					effect: { singularityCores: 0.1 },
				},
				voidMiner: { cost: { singularityCores: 1 }, effect: { darkMatter: 5 } },
			},
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
			workers: {
				realityArchitect: {
					cost: { cosmicStrings: 1 },
					effect: { entropy: -0.1 },
				},
				chronoEngineer: { cost: { entropy: 10 }, effect: { cosmicStrings: 1 } },
			},
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
