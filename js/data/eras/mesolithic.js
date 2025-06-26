/**
 * Mesolithic Era (Middle Stone Age) Data
 * Transitional period between Paleolithic and Neolithic
 */

export const mesolithicEra = {
	id: 'mesolithic',
	name: 'Mesolithic Era',
	dateRange: '10,000 BCE - 8,000 BCE',

	description: 'The Middle Stone Age - a time of innovation and adaptation.',

	keyFeatures: [
		'Improved tool technology',
		'Seasonal settlements',
		'Advanced hunting techniques',
		'Early domestication attempts',
	],

	// Available resources in this era
	resources: [
		'sticks',
		'stones',
		'rawMeat',
		'meat',
		'cookedMeat',
		'hide',
		'bones',
		'fur',
		'clothes',
	],

	// Available actions
	actions: [
		{
			id: 'forage',
			name: 'Forage for Sticks',
			description: 'Gather sticks and occasionally find stones',
			baseYield: { sticks: 1 },
			bonusChance: { stones: 0.25 },
			cooldown: 1000,
		},
		{
			id: 'hunt',
			name: 'Hunt Animals',
			description: 'Hunt for meat, bones, and fur',
			baseYield: { meat: 2, bones: 1 },
			bonusChance: { fur: 0.7 },
			cooldown: 1500,
			requirements: { upgrades: ['fireControl'] },
		},
		{
			id: 'cook',
			name: 'Cook Meat',
			description: 'Turn raw meat into cooked meat',
			baseYield: { cookedMeat: 1 },
			cost: { meat: 1 },
			failureChance: 0.25,
			cooldown: 800,
			requirements: { upgrades: ['fireControl'] },
		},
	],

	// Available workers
	workers: [
		{
			id: 'forager',
			name: 'Forager',
			description: 'Automatically gathers sticks and stones',
			cost: { cookedMeat: 8 },
			baseProduction: { sticks: 1 },
			bonusProduction: { stones: 0.3 },
			workInterval: 8000,
		},
		{
			id: 'hunter',
			name: 'Hunter',
			description: 'Automatically hunts for meat and other materials',
			cost: { cookedMeat: 12 },
			baseProduction: { meat: 2, bones: 1 },
			bonusProduction: { fur: 0.6 },
			workInterval: 12000,
		},
		{
			id: 'cook',
			name: 'Cook',
			description: 'Automatically cooks raw meat',
			cost: { cookedMeat: 10 },
			baseProduction: { cookedMeat: 1 },
			inputRequired: { meat: 1 },
			failureChance: 0.2,
			workInterval: 6000,
		},
	],

	// Available upgrades
	upgrades: [
		{
			id: 'improvedTools',
			name: 'Improved Stone Tools',
			description: 'Better tools increase gathering efficiency',
			cost: { stones: 40, bones: 25 },
			effect: {
				workerBonuses: {
					forager: { sticks: 1, stones: 1 },
					hunter: { meat: 1 },
				},
			},
			maxCount: 1,
		},
		{
			id: 'seasonalShelters',
			name: 'Seasonal Shelters',
			description: 'Temporary structures that improve worker efficiency',
			cost: { sticks: 60, hide: 20 },
			effect: {
				workerSpeed: 0.85, // 15% faster
			},
			maxCount: 1,
		},
		{
			id: 'advancedHunting',
			name: 'Advanced Hunting Techniques',
			description: 'Improved hunting methods yield more resources',
			cost: { bones: 30, fur: 15 },
			effect: {
				huntingYield: 1.5, // 50% more yield
				furDropChance: 0.8,
			},
			maxCount: 1,
		},
		{
			id: 'foodPreservation',
			name: 'Food Preservation',
			description: 'Reduces food spoilage and cooking failures',
			cost: { hide: 25, stones: 35 },
			effect: {
				cookingFailureRate: 0.5, // Half the failure rate
				foodDecayRate: 0.8,
			},
			maxCount: 1,
		},
	],

	// Unlock conditions for next era
	progressionRequirements: {
		resources: {
			clothes: 10,
			cookedMeat: 50,
			tools: 5,
		},
		workers: {
			total: 8,
			types: 3,
		},
		upgrades: ['improvedTools', 'seasonalShelters'],
	},

	// Random events specific to this era
	events: [
		{
			id: 'seasonalMigration',
			name: 'Seasonal Animal Migration',
			description: 'Large herds pass through your territory',
			chance: 0.15,
			trigger: 'hunting',
			effect: {
				resources: { meat: 10, bones: 5, fur: 8 },
			},
		},
		{
			id: 'toolBreakage',
			name: 'Tool Breakage',
			description: 'Some of your tools break during use',
			chance: 0.1,
			trigger: 'working',
			effect: {
				workerEfficiency: 0.8,
				duration: 30000, // 30 seconds
			},
		},
		{
			id: 'abundantForaging',
			name: 'Abundant Resources',
			description: 'You discover a rich area for foraging',
			chance: 0.2,
			trigger: 'foraging',
			effect: {
				resources: { sticks: 15, stones: 8 },
			},
		},
	],

	// Era-specific mechanics
	mechanics: {
		seasonality: {
			enabled: true,
			cycleDuration: 120000, // 2 minutes per season
			effects: {
				spring: { foraging: 1.2, hunting: 1.0 },
				summer: { foraging: 1.5, hunting: 0.8 },
				autumn: { foraging: 1.3, hunting: 1.3 },
				winter: { foraging: 0.7, hunting: 1.1 },
			},
		},

		weatherEffects: {
			enabled: true,
			changeChance: 0.05, // 5% chance per minute
			effects: {
				rain: { foraging: 0.8, hunting: 0.9 },
				storm: { foraging: 0.5, hunting: 0.6 },
				clear: { foraging: 1.1, hunting: 1.1 },
			},
		},
	},
};
