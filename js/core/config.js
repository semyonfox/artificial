export const config = {
// Resource display icons organized by historical era (fixed invalid/duplicate icons)
    resourceIcons: {
// Paleolithic Era
        sticks: '🪵',
        stones: '🪨',
        meat: '🥩',
        cookedMeat: '🍖',
        bones: '🦴',
        fur: '🧥',
// Neolithic Era
        grain: '🌾',
        clay: '🧱',
        pottery: '⚱️',
        livestock: '🐄',
        textiles: '🧶',
        tools: '🧰',
// Bronze Age
        copper: '🔶',
        tin: '🔹',
        bronze: '🔨',
        wheel: '🛞',
        writing: '📜',
        trade: '💰',
// Iron Age
        iron: '⛓️',
        steel: '🔩',
        coins: '🪙',
        roads: '🛣️',
        cities: '🏛️',
        knowledge: '📚',
// Classical Era
        engineering: '🏗️',
        aqueducts: '💧',
        philosophy: '🤔',
        mathematics: '📐',
        medicine: '⚕️',
        art: '🎨',
// Medieval Era
        agriculture: '🌱',
        mills: '🌬️',
        guilds: '👥',
        manuscripts: '📖',
        castles: '🏰',
        religion: '⛪',
// Renaissance
        printing: '🖨️',
        exploration: '🧭',
        banking: '🏦',
        gunpowder: '💥',
        optics: '🔭',
        navigation: '⛵',
// Industrial Age
        coal: '⛏️',
        steam: '💨',
        factories: '🏭',
        railways: '🚂',
        electricity: '⚡',
// Information Age
        silicon: '🔌',
        computers: '💻',
        data: '💾',
        internet: '🌐',
        satellites: '🛰️',
        software: '🧩',
// Space Age
        rockets: '🚀',
        solarPanels: '☀️',
        robotics: '🤖',
        fusion: '⚛️',
        spaceStations: '🛸',
        terraforming: '🌍',
// Galactic Era
        antimatter: '⚛️',
        darkMatter: '🌌',
        wormholes: '🕳️',
        dysonSpheres: '☀️',
        quantumComputers: '🧠',
        timeManipulation: '⏳',
// Universal Era
        multiverseAccess: '🌀',
        realityEngines: '🧬',
        consciousnessTransfer: '👁️',
        universalConstants: '🎲',
        existentialEnergy: '✨',
        cosmicStrings: '🌠',
// Special
        population: '👥',
        defense: '🛡️',
        research: '📚'
    },

// Era definitions with historically-aligned periods
    eras: {
        paleolithic: {
            name: 'Paleolithic Era',
            timespan: '2.6M - 10K BCE',
            description: "Old Stone Age: hunter-gatherers, stone tools, fire, clothing."
        },
        neolithic: {
            name: 'Neolithic Era',
            timespan: '10K - 3.3K BCE',
            description: 'Agricultural Revolution: farming, pottery, weaving, permanent settlements.'
        },
        bronze: {
            name: 'Bronze Age',
            timespan: '3300 - 1200 BCE',
            description: 'Copper + tin alloying, writing, the wheel, early trade networks.'
        },
        iron: {
            name: 'Iron Age',
            timespan: '1200 - 600 BCE',
            description: 'Iron smelting, coinage, roads, fortified cities.'
        },
        classical: {
            name: 'Classical Era',
            timespan: '600 BCE - 500 CE',
            description: 'Greece and Rome: philosophy, math, medicine, large-scale engineering.'
        },
        medieval: {
            name: 'Medieval Era',
            timespan: '500 - 1500 CE',
            description: 'Feudalism, mills, guilds, manuscript culture, castles.'
        },
        renaissance: {
            name: 'Renaissance',
            timespan: '1300 - 1600 CE',
            description: 'Printing press, banking, navigation, optics, gunpowder.'
        },
        industrial: {
            name: 'Industrial Age',
            timespan: '1760 - 1840',
            description: 'Steam power, coal, factories, railways, electrification begins.'
        },
        information: {
            name: 'Information Age',
            timespan: '1950 - 2020',
            description: 'Silicon, microprocessors, internet, software and satellites.'
        },
        space: {
            name: 'Space Age',
            timespan: '1957 - 2100',
            description: 'Rockets, solar power, robotics, fusion research, orbital stations.'
        },
        galactic: {
            name: 'Galactic Era',
            timespan: '2100+',
            description: 'Interstellar industry: Dyson swarms, FTL concepts, quantum computing.'
        },
        universal: {
            name: 'Universal Era',
            timespan: 'Far Future',
            description: 'Reality manipulation, multiverse access, consciousness transfer.'
        }
    },

// Core resources active per era (keeps gameplay focused and not bloated)
    activeResourcesByEra: {
        paleolithic: ['sticks', 'stones', 'meat', 'cookedMeat', 'bones', 'fur', 'population'],
        neolithic: ['grain', 'clay', 'pottery', 'livestock', 'textiles', 'tools', 'population'],
        bronze: ['copper', 'tin', 'bronze', 'wheel', 'writing', 'trade', 'population'],
        iron: ['iron', 'steel', 'coins', 'roads', 'cities', 'knowledge', 'population'],
        classical: ['engineering', 'aqueducts', 'philosophy', 'mathematics', 'medicine', 'art', 'population'],
        medieval: ['agriculture', 'mills', 'guilds', 'manuscripts', 'castles', 'religion', 'population'],
        renaissance: ['printing', 'exploration', 'banking', 'gunpowder', 'optics', 'navigation', 'population'],
        industrial: ['coal', 'steam', 'factories', 'railways', 'electricity', 'steel', 'population'],
        information: ['silicon', 'computers', 'data', 'internet', 'satellites', 'software', 'population'],
        space: ['rockets', 'solarPanels', 'robotics', 'fusion', 'spaceStations', 'terraforming', 'population'],
        galactic: ['antimatter', 'darkMatter', 'wormholes', 'dysonSpheres', 'quantumComputers', 'timeManipulation', 'population'],
        universal: ['multiverseAccess', 'realityEngines', 'consciousnessTransfer', 'universalConstants', 'existentialEnergy', 'cosmicStrings', 'population']
    },

// Simple tech tree per era (3–5 techs each, clear unlocks and small multipliers)
    techTree: {
        paleolithic: [
            { key: 'fireControl', name: 'Fire Control', cost: { sticks: 15, stones: 5 }, effects: { unlocks: ['cookedMeat', 'cooking'], multipliers: { meat: 1.1 } } },
            { key: 'stoneKnapping', name: 'Stone Knapping', cost: { stones: 10, sticks: 10 }, effects: { multipliers: { sticks: 1.2, stones: 1.3, meat: 1.2 } } },
            { key: 'clothing', name: 'Clothing', cost: { fur: 5, bones: 3 }, effects: { multipliers: { population: 1.05 }, workerBonus: { hunting: 0.1 } } },
            { key: 'boneTools', name: 'Bone Tools', cost: { bones: 8, stones: 6 }, effects: { multipliers: { sticks: 1.5, stones: 1.5, meat: 1.5 } } }
        ],
        neolithic: [
            { key: 'agriculture', name: 'Agriculture', cost: { tools: 5, grain: 20 }, effects: { multipliers: { grain: 2.0, population: 1.05 }, unlocks: ['farmer'] } },
            { key: 'animalDomestication', name: 'Animal Domestication', cost: { grain: 10 }, effects: { multipliers: { livestock: 1.5, meat: 1.2 } } },
            { key: 'pottery', name: 'Pottery', cost: { clay: 15 }, effects: { unlocks: ['potteryRecipe', 'kiln'], multipliers: { grain: 1.2 } } },
            { key: 'weaving', name: 'Weaving', cost: { textiles: 10 }, effects: { multipliers: { textiles: 1.6 } } }
        ],
        bronze: [
            { key: 'copperMining', name: 'Copper Mining', cost: { tools: 8 }, effects: { multipliers: { copper: 1.6 } } },
            { key: 'tinMining', name: 'Tin Mining', cost: { tools: 6 }, effects: { multipliers: { tin: 1.6 } } },
            { key: 'alloying', name: 'Alloying (Bronze)', cost: { copper: 10, tin: 5 }, effects: { unlocks: ['bronzeRecipe', 'smithWorkshop'], multipliers: { bronze: 2.0 } } },
            { key: 'theWheel', name: 'The Wheel', cost: { wood: 0, stones: 10 }, effects: { unlocks: ['wheel'], multipliers: { trade: 1.3 } } },
            { key: 'writingSystems', name: 'Writing Systems', cost: { pottery: 8 }, effects: { multipliers: { knowledge: 1.3, writing: 1.5 }, unlocks: ['scribe'] } }
        ],
        iron: [
            { key: 'ironSmelting', name: 'Iron Smelting', cost: { bronze: 10, coal: 6 }, effects: { multipliers: { iron: 2.0 } } },
            { key: 'bloomery', name: 'Bloomery Furnaces', cost: { iron: 10 }, effects: { multipliers: { iron: 1.5, tools: 1.2 }, unlocks: ['steelRecipe'] } },
            { key: 'coinage', name: 'Coinage', cost: { bronze: 12 }, effects: { multipliers: { trade: 1.4, coins: 1.6 } } },
            { key: 'roadBuilding', name: 'Road Building', cost: { stones: 20 }, effects: { unlocks: ['roads'], multipliers: { trade: 1.2, cities: 1.1 } } }
        ],
        classical: [
            { key: 'civilEngineering', name: 'Civil Engineering', cost: { iron: 12, coins: 10 }, effects: { unlocks: ['aqueducts'], multipliers: { cities: 1.2, engineering: 1.5 } } },
            { key: 'philosophySchools', name: 'Philosophy Schools', cost: { writing: 10 }, effects: { multipliers: { knowledge: 1.4, philosophy: 1.5 } } },
            { key: 'mathematics', name: 'Mathematics', cost: { writing: 12 }, effects: { multipliers: { engineering: 1.2, mathematics: 1.7 } } },
            { key: 'medicine', name: 'Medicine', cost: { manuscripts: 6 }, effects: { multipliers: { population: 1.05, medicine: 1.5 } } }
        ],
        medieval: [
            { key: 'heavyPlow', name: 'Heavy Plow', cost: { iron: 8, wood: 0 }, effects: { multipliers: { agriculture: 1.6, grain: 1.3 } } },
            { key: 'watermills', name: 'Water/Wind Mills', cost: { stones: 15, wood: 0 }, effects: { unlocks: ['mill'], multipliers: { mills: 1.8 } } },
            { key: 'guildSystem', name: 'Guild System', cost: { coins: 12 }, effects: { multipliers: { guilds: 1.5, trade: 1.2 } } },
            { key: 'scriptoria', name: 'Scriptoria', cost: { manuscripts: 8 }, effects: { multipliers: { manuscripts: 1.8, knowledge: 1.2 } } }
        ],
        renaissance: [
            { key: 'printingPress', name: 'Printing Press', cost: { manuscripts: 12 }, effects: { unlocks: ['printingHouse'], multipliers: { printing: 2.0, knowledge: 1.3 } } },
            { key: 'navigation', name: 'Navigation', cost: { maps: 0 }, effects: { multipliers: { exploration: 1.5, trade: 1.2, navigation: 1.4 } } },
            { key: 'banking', name: 'Banking', cost: { coins: 20 }, effects: { multipliers: { banking: 1.6, trade: 1.3 } } },
            { key: 'optics', name: 'Optics', cost: { glass: 0 }, effects: { multipliers: { optics: 1.7, knowledge: 1.2 } } },
            { key: 'gunpowder', name: 'Gunpowder', cost: { saltpeter: 0 }, effects: { multipliers: { gunpowder: 1.5, defense: 1.2 } } }
        ],
        industrial: [
            { key: 'steamEngine', name: 'Steam Engine', cost: { coal: 20, iron: 12 }, effects: { unlocks: ['workshop', 'railways'], multipliers: { steam: 2.0, factories: 1.3 } } },
            { key: 'electrification', name: 'Electrification', cost: { coal: 10, copper: 8 }, effects: { multipliers: { electricity: 1.8, factories: 1.2 } } },
            { key: 'bessemer', name: 'Bessemer Steel', cost: { coal: 10, iron: 20 }, effects: { multipliers: { steel: 2.2, railways: 1.2 } } }
        ],
        information: [
            { key: 'siliconProcessing', name: 'Silicon Processing', cost: { steel: 8, electricity: 15 }, effects: { multipliers: { silicon: 1.8 } } },
            { key: 'microprocessor', name: 'Microprocessor', cost: { silicon: 20 }, effects: { multipliers: { computers: 2.0, data: 1.3 }, unlocks: ['scholar'] } },
            { key: 'networking', name: 'Networking', cost: { computers: 10 }, effects: { multipliers: { internet: 2.0, data: 1.5 } } },
            { key: 'softwareEngineering', name: 'Software Engineering', cost: { data: 20 }, effects: { multipliers: { software: 2.0 } } },
            { key: 'satellites', name: 'Satellites', cost: { steel: 10, electricity: 10 }, effects: { multipliers: { satellites: 1.8, internet: 1.1 } } }
        ],
        space: [
            { key: 'rocketry', name: 'Rocketry', cost: { steel: 20, computers: 10 }, effects: { unlocks: ['launchPad'], multipliers: { rockets: 2.0 } } },
            { key: 'orbitalHab', name: 'Orbital Habitation', cost: { rockets: 10, satellites: 10 }, effects: { unlocks: ['spaceStations'], multipliers: { spaceStations: 1.7 } } },
            { key: 'fusionResearch', name: 'Fusion Research', cost: { computers: 20, electricity: 20 }, effects: { multipliers: { fusion: 1.8, solarPanels: 1.2 } } },
            { key: 'spaceRobotics', name: 'Space Robotics', cost: { robotics: 10 }, effects: { multipliers: { robotics: 2.0, rockets: 1.1 } } }
        ],
        galactic: [
            { key: 'dysonSwarm', name: 'Dyson Swarm', cost: { robotics: 20, solarPanels: 30 }, effects: { multipliers: { dysonSpheres: 2.0, electricity: 1.5 } } },
            { key: 'quantumComputing', name: 'Quantum Computing', cost: { computers: 30, satellites: 20 }, effects: { multipliers: { quantumComputers: 2.0, data: 1.5 } } },
            { key: 'wormholeTheory', name: 'Wormhole Theory', cost: { quantumComputers: 10 }, effects: { multipliers: { wormholes: 1.8 } } },
            { key: 'antimatterContainment', name: 'Antimatter Containment', cost: { fusion: 20 }, effects: { multipliers: { antimatter: 2.0 } } }
        ],
        universal: [
            { key: 'realityEngineering', name: 'Reality Engineering', cost: { quantumComputers: 20, antimatter: 20 }, effects: { multipliers: { realityEngines: 2.0 } } },
            { key: 'multiversalPhysics', name: 'Multiversal Physics', cost: { wormholes: 15 }, effects: { multipliers: { multiverseAccess: 1.8, universalConstants: 1.3 } } },
            { key: 'consciousnessTransfer', name: 'Consciousness Transfer', cost: { quantumComputers: 12 }, effects: { multipliers: { consciousnessTransfer: 2.0, population: 1.02 } } }
        ]
    },

// Minimal buildings per era (1–2), used by tech unlocks
    buildingsByEra: {
        paleolithic: ['campfire', 'shelter'],
        neolithic: ['granary', 'kiln'],
        bronze: ['smithWorkshop', 'market'],
        iron: ['forge', 'roadNetwork'],
        classical: ['aqueduct', 'library'],
        medieval: ['mill', 'castle'],
        renaissance: ['printingHouse', 'bank'],
        industrial: ['workshop', 'factory'],
        information: ['dataCenter', 'serverFarm'],
        space: ['launchPad', 'orbitalDock'],
        galactic: ['fusionReactor', 'dysonSegment'],
        universal: ['realityEngine', 'consciousnessHub']
    },

// Workers available by era (reuses your existing timers/types)
    workersByEra: {
        paleolithic: ['gatherer', 'hunter', 'cook', 'craftsman'],
        neolithic: ['gatherer', 'hunter', 'cook', 'craftsman', 'farmer'],
        bronze: ['gatherer', 'hunter', 'craftsman', 'farmer', 'miner'],
        iron: ['farmer', 'miner', 'engineer'],
        classical: ['farmer', 'miner', 'engineer', 'scholar'],
        medieval: ['farmer', 'miner', 'engineer', 'scholar'],
        renaissance: ['farmer', 'miner', 'engineer', 'scholar'],
        industrial: ['farmer', 'miner', 'engineer', 'scholar'],
        information: ['farmer', 'miner', 'engineer', 'scholar'],
        space: ['engineer', 'scholar'],
        galactic: ['engineer', 'scholar'],
        universal: ['engineer', 'scholar']
    },

// Simple crafting/transforms used across eras
    crafting: {
        cookedMeatRecipe: { inputs: { meat: 1 }, output: { cookedMeat: 1 } },
        potteryRecipe: { inputs: { clay: 3 }, output: { pottery: 2 } },
        bronzeRecipe: { inputs: { copper: 2, tin: 1 }, output: { bronze: 2 } },
        steelRecipe: { inputs: { iron: 2, coal: 1 }, output: { steel: 2 } }
    },

// Progression gates: straightforward and minimal (population + key techs + small stockpile)
    eraRequirements: {
        paleolithic: { next: 'neolithic', require: { population: 15, techs: ['fireControl', 'stoneKnapping'], stockpile: { cookedMeat: 10 } } },
        neolithic: { next: 'bronze', require: { population: 60, techs: ['agriculture', 'pottery', 'animalDomestication'], stockpile: { grain: 50, pottery: 10 } } },
        bronze: { next: 'iron', require: { population: 200, techs: ['alloying', 'theWheel', 'writingSystems'], stockpile: { copper: 20, tin: 10, bronze: 20 } } },
        iron: { next: 'classical', require: { population: 600, techs: ['ironSmelting', 'coinage', 'roadBuilding'], stockpile: { iron: 40, coins: 20 } } },
        classical: { next: 'medieval', require: { population: 1200, techs: ['civilEngineering', 'philosophySchools', 'mathematics'], stockpile: { cities: 10 } } },
        medieval: { next: 'renaissance', require: { population: 3000, techs: ['heavyPlow', 'watermills', 'guildSystem'], stockpile: { manuscripts: 20 } } },
        renaissance: { next: 'industrial', require: { population: 10000, techs: ['printingPress', 'banking', 'navigation'], stockpile: { printing: 20 } } },
        industrial: { next: 'information', require: { population: 50000, techs: ['steamEngine', 'bessemer', 'electrification'], stockpile: { steel: 50, electricity: 50 } } },
        information: { next: 'space', require: { population: 200000, techs: ['microprocessor', 'networking', 'satellites'], stockpile: { computers: 50, data: 100 } } },
        space: { next: 'galactic', require: { population: 1000000, techs: ['rocketry', 'orbitalHab', 'fusionResearch'], stockpile: { rockets: 20, spaceStations: 5 } } },
        galactic: { next: 'universal', require: { population: 5000000, techs: ['dysonSwarm', 'quantumComputing', 'wormholeTheory'], stockpile: { dysonSpheres: 1 } } }
    },

// Historical events and disasters by era (trimmed and corrected placement)
    events: {
        paleolithic: [
            { type: 'disaster', name: 'Ice Age', description: 'Harsh winters reduce food availability', effect: { meat: -0.5, fur: 0.2 } },
            { type: 'discovery', name: 'Cave Paintings', description: 'Early artistic expression discovered', effect: { population: 0.1 } },
            { type: 'breakthrough', name: 'Tool Making', description: 'Better stone tool techniques developed', effect: { stones: 0.3 } }
        ],
        neolithic: [
            { type: 'disaster', name: 'Crop Failure', description: 'Poor harvest threatens settlement', effect: { grain: -0.4, population: -0.1 } },
            { type: 'discovery', name: 'Animal Domestication', description: 'Livestock provide steady resources', effect: { livestock: 0.5, meat: 0.2 } },
            { type: 'breakthrough', name: 'Pottery Wheel', description: 'Mass production of clay vessels', effect: { pottery: 0.4 } },
            { type: 'disaster', name: 'Drought', description: 'Extended dry period affects crops', effect: { grain: -0.3, livestock: -0.2 } },
            { type: 'discovery', name: 'Weaving Techniques', description: 'Advanced textile production methods', effect: { textiles: 0.6 } }
        ],
        bronze: [
            { type: 'disaster', name: 'Bronze Age Collapse', description: 'Mysterious societal collapse', effect: { trade: -0.6, cities: -0.3 } },
            { type: 'discovery', name: 'Written Language', description: 'Complex writing systems developed', effect: { writing: 0.5, knowledge: 0.3 } },
            { type: 'breakthrough', name: 'The Wheel', description: 'Revolutionary transportation technology', effect: { trade: 0.4, wheel: 1.0 } },
            { type: 'disaster', name: 'Trade Route Disruption', description: 'Key trade connections severed', effect: { bronze: -0.4, trade: -0.5 } }
        ],
        iron: [
            { type: 'disaster', name: 'War and Conquest', description: 'Military conflicts devastate regions', effect: { population: -0.3, cities: -0.2 } },
            { type: 'breakthrough', name: 'Smelting Advances', description: 'Improved furnaces increase output', effect: { iron: 0.5, steel: 0.2 } },
            { type: 'discovery', name: 'Coinage Reform', description: 'Standardized money boosts trade', effect: { trade: 0.4, coins: 0.4 } }
        ],
        classical: [
            { type: 'disaster', name: 'Plague Outbreak', description: 'Disease spreads through cities', effect: { population: -0.4, cities: -0.1 } },
            { type: 'discovery', name: 'Philosophical Schools', description: 'Systematic inquiry thrives', effect: { knowledge: 0.6, philosophy: 0.5 } },
            { type: 'breakthrough', name: 'Aqueducts', description: 'Urban infrastructure expands', effect: { aqueducts: 0.8, cities: 0.3 } }
        ],
        medieval: [
            { type: 'disaster', name: 'Famine', description: 'Food shortages due to poor harvests', effect: { agriculture: -0.4, population: -0.1 } },
            { type: 'discovery', name: 'Watermills Spread', description: 'Mechanization of milling', effect: { mills: 0.7 } },
            { type: 'breakthrough', name: 'Guild Charters', description: 'Organized crafts improve quality', effect: { guilds: 0.6, trade: 0.2 } }
        ],
        renaissance: [
            { type: 'discovery', name: 'Printing Boom', description: 'Knowledge dissemination accelerates', effect: { printing: 0.8, knowledge: 0.3 } },
            { type: 'breakthrough', name: 'Ocean Navigation', description: 'Long-range voyages possible', effect: { exploration: 0.6, trade: 0.4 } },
            { type: 'disaster', name: 'Religious Conflicts', description: 'Wars disrupt production', effect: { population: -0.1, banking: -0.2 } }
        ],
        industrial: [
            { type: 'disaster', name: 'Factory Fire', description: 'Industrial accident damages production', effect: { factories: -0.3, steam: -0.2 } },
            { type: 'discovery', name: 'Electric Power', description: 'Harnessing electrical power', effect: { electricity: 0.6, factories: 0.3 } },
            { type: 'breakthrough', name: 'Steam Engine', description: 'Steam power revolutionizes industry', effect: { steam: 0.8, railways: 0.4 } },
            { type: 'disaster', name: 'Economic Depression', description: 'Financial crisis halts progress', effect: { factories: -0.4, railways: -0.3 } }
        ],
        information: [
            { type: 'disaster', name: 'System Crash', description: 'Major systems fail', effect: { data: -0.4, computers: -0.2 } },
            { type: 'discovery', name: 'Internet', description: 'Global information network', effect: { internet: 0.7, data: 0.5 } },
            { type: 'breakthrough', name: 'Microprocessor', description: 'Computers become ubiquitous', effect: { silicon: 0.6, computers: 0.8 } },
            { type: 'disaster', name: 'Cyber Attack', description: 'Malware damages networks', effect: { internet: -0.3, data: -0.5 } },
            { type: 'discovery', name: 'Artificial Intelligence', description: 'ML breakthroughs', effect: { software: 1.0, data: 0.8 } }
        ],
        space: [
            { type: 'disaster', name: 'Launch Failure', description: 'Rocket lost on ascent', effect: { rockets: -0.5 } },
            { type: 'discovery', name: 'Reusable Boosters', description: 'Cheaper access to orbit', effect: { rockets: 0.8, satellites: 0.4 } },
            { type: 'breakthrough', name: 'In-Situ Resource Use', description: 'Off-world resource utilization', effect: { spaceStations: 0.5, robotics: 0.4 } }
        ],
        galactic: [
            { type: 'disaster', name: 'Containment Breach', description: 'Antimatter containment failure', effect: { antimatter: -0.6 } },
            { type: 'breakthrough', name: 'Dyson Segment Deployed', description: 'Massive energy influx', effect: { dysonSpheres: 1.0, electricity: 0.5 } }
        ],
        universal: [
            { type: 'discovery', name: 'Cosmic String Mapping', description: 'Energy channeling improves', effect: { cosmicStrings: 0.7, existentialEnergy: 0.4 } }
        ]
    },

// Worker automation timers (ms)
    workerTimers: {
        gatherer: 8000,
        hunter: 12000,
        cook: 6000,
        craftsman: 10000,
        farmer: 15000,
        miner: 12000,
        scholar: 20000,
        engineer: 25000
    },

// Base resource yields
    yields: {
        huntYield: 2,
        forageYield: 1,
        stickYield: 1,
        stoneYield: 1
    },

// Probability values for random events
    probabilities: {
        burnChance: 0.5,
        stoneChanceFromSticks: 0.35, // Increased from 0.2 to 0.35 (75% increase)
        furDropChance: 0.6,
        eventChance: 0.1, // 10% per minute
        disasterChance: 0.05 // 5% disasters
    },

// Game balance variables
    gameVariables: {
        meatProduction: 1,
        foodProduction: 1,
        workerFoodConsumption: 1,
        researchSpeed: 1,
        populationGrowth: 1
    },

// UI configuration
    ui: {
        notificationDuration: 2000, // Reduced from 3000 to 2000
        progressAnimationSpeed: 200
    },

// Save/load settings
    storage: {
        saveKey: 'evolutionClickerSave',
        autoSaveInterval: 30000
    },

// Worker bonuses and efficiency multipliers (kept small)
    workerBonuses: {
        gathering: 0.5,
        hunting: 0.8,
        cooking: 0.3,
        farming: 1.0,
        crafting: 0.7,
        scholarly: 1.2,
        engineering: 1.5
    },

// Resource efficiency multipliers by upgrade (keep tight)
    efficiencyMultipliers: {
        sticks: { stoneKnapping: 1.2, boneTools: 1.5, shelterBuilding: 1.3 },
        stones: { stoneKnapping: 1.5, boneTools: 1.8 },
        meat: { stoneKnapping: 2.0, boneTools: 2.5, furClothing: 1.3 },
        grain: { agriculture: 2.0, tools: 1.5, pottery: 1.2 },
        bronze: { bronzeWorking: 2.0, wheel: 1.3, mathematics: 1.2 }
    },

// Game balance constants
    balance: {
        basePopulationGrowth: 0.001,
        populationGrowth: {
            baseRate: 0.01, // 0.01 population per second
            clothingBonus: 1.5, // 1.5× with clothing upgrade
            shelterBonus: 2.0 // 2× with shelter upgrade
        },
        maxPopulationPerEra: {
            paleolithic: 50,
            neolithic: 200,
            bronze: 1000,
            iron: 5000,
            classical: 12000,
            medieval: 30000,
            renaissance: 60000,
            industrial: 500000,
            information: 1000000,
            space: 5000000,
            galactic: 20000000,
            universal: 100000000
        },
        workerEfficiency: {
            wellFed: 1.0,
            hungry: 0.5,
            starving: 0.1
        },
// Legacy global progression weights (kept but superseded by eraRequirements)
        eraProgressionRequirements: {
            populationMultiplier: 1.5,
            resourceDiversity: 0.7,
            upgradeCompletion: 0.6
        }
    },

// Complete era definitions with workers, upgrades, and progression requirements
    eraData: {
        paleolithic: {
            id: 'paleolithic',
            name: 'Paleolithic Era',
            timespan: '2.6M - 10K BCE',
            description: "The Old Stone Age - humanity's longest period of hunter-gatherer societies and stone tool use.",
            advancementCost: { population: 10, cookedMeat: 8 }, // Reduced from 15/10
            workers: [
                {
                    id: 'gatherer',
                    name: 'Gatherer',
                    description: 'Collects sticks, stones, and plant materials. The foundation of Paleolithic survival.',
                    cost: { sticks: 3 }, // Reduced from 5 to ease early grind
                    produces: { sticks: 1, stones: 0.3 },
                    interval: 4000,
                },
                {
                    id: 'hunter',
                    name: 'Hunter',
                    description: 'Hunts animals for meat, bones, and fur using stone tools. Requires stone knapping knowledge.',
                    cost: { stones: 5, bones: 1 }, // Reduced from 8/2/2 to ease early grind
                    produces: { meat: 1, bones: 0.4, fur: 0.3 },
                    interval: 6000,
                    requiresUpgrade: 'stoneKnapping',
                },
                {
                    id: 'cook',
                    name: 'Cook',
                    description: 'Cooks meat over fire, making it safer and more nutritious. Essential for population growth.',
                    cost: { sticks: 5, stones: 1 }, // Reduced from 10/2/1 and removed cookedMeat requirement
                    produces: { cookedMeat: 1 },
                    consumes: { meat: 1 },
                    interval: 3000,
                    requiresUpgrade: 'fireControl',
                },
            ],
            upgrades: [
                {
                    id: 'stoneKnapping',
                    name: 'Stone Knapping',
                    description: 'Master the art of shaping stone into sharp tools and weapons',
                    cost: { stones: 10, sticks: 10 },
                    effect: 'Unlocks hunting and improves tool efficiency',
                    priority: 1,
                    historical: "Stone knapping was humanity's first technology, dating back 2.6 million years.",
                },
                {
                    id: 'fireControl',
                    name: 'Fire Control',
                    description: 'Learn to make and maintain fire - a revolutionary survival technology',
                    cost: { sticks: 15, stones: 5 },
                    effect: 'Unlocks cooking, provides warmth, and enables advanced crafting',
                    priority: 2,
                    historical: 'Controlled use of fire began around 790,000 years ago, transforming human evolution.',
                },
                {
                    id: 'boneTools',
                    name: 'Bone Tools',
                    description: 'Craft specialized tools from animal bones for better efficiency',
                    cost: { bones: 8, stones: 6 },
                    effect: 'Improves all resource gathering efficiency by 50%',
                    priority: 3,
                    historical: 'Bone tools appeared around 90,000 years ago, showing advanced craftsmanship.',
                    requiresUpgrade: 'fireControl',
                },
                {
                    id: 'clothing',
                    name: 'Fur Clothing',
                    description: 'Create warm clothing from animal furs for survival in harsh climates',
                    cost: { fur: 5, bones: 3 },
                    effect: 'Increases population growth rate by 50%',
                    priority: 4,
                    historical: 'Clothing likely developed 170,000 years ago, enabling migration to colder regions.',
                    requiresUpgrade: 'stoneKnapping',
                },
                {
                    id: 'shelterBuilding',
                    name: 'Shelter Construction',
                    description: 'Build permanent shelters using sticks, stones, and fur',
                    cost: { sticks: 30, stones: 20, fur: 8, bones: 6 },
                    effect: 'Doubles population growth rate and reduces disaster damage',
                    priority: 5,
                    historical: 'The oldest known structures date to 400,000 years ago in Terra Amata, France.',
                },
            ],
        },

        neolithic: {
            id: 'neolithic',
            name: 'Neolithic Era',
            timespan: '10K - 3.3K BCE',
            description: 'The New Stone Age - the Agricultural Revolution begins with farming and permanent settlements.',
            advancementCost: { population: 60, grain: 100, pottery: 20 },
            workers: [
                {
                    id: 'farmer',
                    name: 'Farmer',
                    description: 'Cultivates grain crops, revolutionizing food production and enabling larger populations.',
                    cost: { grain: 15, tools: 5, pottery: 3 },
                    produces: { grain: 3, population: 0.1 },
                    interval: 8000,
                },
                {
                    id: 'potter',
                    name: 'Potter',
                    description: 'Creates clay vessels for storage and cooking, essential for agricultural society.',
                    cost: { clay: 20, grain: 10 },
                    produces: { pottery: 2, tools: 0.3 },
                    interval: 6000,
                    requiresUpgrade: 'pottery',
                },
                {
                    id: 'herder',
                    name: 'Herder',
                    description: 'Domesticates and raises livestock for meat, milk, and textiles.',
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
                    cost: { grain: 50, tools: 20 },
                    effect: 'Unlocks farming and greatly increases food production',
                    priority: 1,
                    historical: 'Agriculture developed independently around 10,000 BCE in the Fertile Crescent.',
                },
                {
                    id: 'pottery',
                    name: 'Pottery Making',
                    description: 'Master the art of shaping and firing clay vessels',
                    cost: { clay: 30, tools: 15 },
                    effect: 'Unlocks pottery production and food storage',
                    priority: 2,
                    historical: 'Pottery appeared around 18,000 BCE, enabling food storage and cooking.',
                },
                {
                    id: 'animalDomestication',
                    name: 'Animal Domestication',
                    description: 'Tame wild animals for food, labor, and materials',
                    cost: { grain: 40, livestock: 10, pottery: 20 },
                    effect: 'Unlocks livestock production and increases meat yield',
                    priority: 3,
                    historical: 'Dogs were first domesticated 15,000 years ago, followed by sheep and goats.',
                },
                {
                    id: 'weaving',
                    name: 'Textile Weaving',
                    description: 'Create cloth from plant and animal fibers',
                    cost: { textiles: 25, tools: 18, livestock: 5 },
                    effect: 'Improves clothing and trade opportunities',
                    priority: 4,
                    historical: 'Textile production began around 7000 BCE with linen in Egypt.',
                },
            ],
        },

        bronze: {
            id: 'bronze',
            name: 'Bronze Age',
            timespan: '3300 - 1200 BCE',
            description: 'First metal working civilizations emerge with bronze tools revolutionizing society.',
            advancementCost: { population: 200, bronze: 100, writing: 50 },
            workers: [
                {
                    id: 'metalworker',
                    name: 'Metalworker',
                    description: 'Smelts copper and tin to create bronze tools and weapons.',
                    cost: { copper: 30, tin: 10, bronze: 5 },
                    produces: { bronze: 2, tools: 1 },
                    interval: 12000,
                    requiresUpgrade: 'alloying',
                },
                {
                    id: 'scribe',
                    name: 'Scribe',
                    description: 'Records information using early writing systems for administration.',
                    cost: { writing: 15, bronze: 8, trade: 5 },
                    produces: { writing: 2, knowledge: 0.5 },
                    interval: 15000,
                    requiresUpgrade: 'writingSystems',
                },
                {
                    id: 'merchant',
                    name: 'Merchant',
                    description: 'Facilitates trade between communities using wheels and roads.',
                    cost: { bronze: 20, wheel: 5, trade: 10 },
                    produces: { trade: 3, bronze: 0.5, wheel: 0.2 },
                    interval: 10000,
                    requiresUpgrade: 'theWheel',
                },
            ],
            upgrades: [
                {
                    id: 'copperMining',
                    name: 'Copper Mining',
                    description: 'Extract copper ore from the earth',
                    cost: { tools: 8 },
                    effect: 'Enables copper production',
                    priority: 1,
                    historical: 'Copper mining began around 5000 BCE.',
                },
                {
                    id: 'tinMining',
                    name: 'Tin Mining',
                    description: 'Discover and mine tin deposits',
                    cost: { tools: 6 },
                    effect: 'Enables tin production',
                    priority: 2,
                    historical: 'Tin mining enabled the Bronze Age.',
                },
                {
                    id: 'alloying',
                    name: 'Bronze Alloying',
                    description: 'Combine copper and tin to create bronze',
                    cost: { copper: 10, tin: 5 },
                    effect: 'Unlocks bronze production and metalworkers',
                    priority: 3,
                    historical: 'Bronze working began around 3500 BCE.',
                },
                {
                    id: 'theWheel',
                    name: 'The Wheel',
                    description: 'Revolutionary invention for transportation',
                    cost: { stones: 10 },
                    effect: 'Unlocks merchants and improves trade',
                    priority: 4,
                    historical: 'The wheel was invented around 3500 BCE in Mesopotamia.',
                },
                {
                    id: 'writingSystems',
                    name: 'Writing Systems',
                    description: 'Develop symbols to record language',
                    cost: { pottery: 8 },
                    effect: 'Unlocks scribes and knowledge accumulation',
                    priority: 5,
                    historical: 'Cuneiform writing emerged around 3400 BCE.',
                },
            ],
        },

        iron: {
            id: 'iron',
            name: 'Iron Age',
            timespan: '1200 - 600 BCE',
            description: 'Iron working spreads, creating stronger tools and weapons, leading to great empires.',
            advancementCost: { population: 600, iron: 100, cities: 20 },
            workers: [
                {
                    id: 'blacksmith',
                    name: 'Blacksmith',
                    description: 'Forges iron into superior tools and weapons.',
                    cost: { iron: 40, coal: 10 },
                    produces: { steel: 2, tools: 2 },
                    interval: 10000,
                    requiresUpgrade: 'ironSmelting',
                },
                {
                    id: 'engineer',
                    name: 'Engineer',
                    description: 'Designs infrastructure for growing civilizations.',
                    cost: { steel: 25, knowledge: 20 },
                    produces: { roads: 1, cities: 0.3 },
                    interval: 18000,
                    requiresUpgrade: 'roadBuilding',
                },
                {
                    id: 'scholar',
                    name: 'Scholar',
                    description: 'Studies philosophy, mathematics, and natural phenomena.',
                    cost: { knowledge: 30, cities: 10 },
                    produces: { knowledge: 3 },
                    interval: 20000,
                },
            ],
            upgrades: [
                {
                    id: 'ironSmelting',
                    name: 'Iron Smelting',
                    description: 'Master the smelting of iron ore',
                    cost: { bronze: 10, coal: 6 },
                    effect: 'Unlocks iron production and blacksmiths',
                    priority: 1,
                    historical: 'Iron working began around 1500 BCE in Anatolia.',
                },
                {
                    id: 'bloomery',
                    name: 'Bloomery Furnaces',
                    description: 'Advanced furnaces for iron production',
                    cost: { iron: 10 },
                    effect: 'Improves iron and steel production',
                    priority: 2,
                    historical: 'Bloomery furnaces were the first iron-smelting technology.',
                },
                {
                    id: 'coinage',
                    name: 'Coinage',
                    description: 'Standardize currency for efficient trade',
                    cost: { bronze: 12 },
                    effect: 'Revolutionizes commerce',
                    priority: 3,
                    historical: 'First coins appeared in Lydia around 650 BCE.',
                },
                {
                    id: 'roadBuilding',
                    name: 'Road Building',
                    description: 'Construct roads for trade and military',
                    cost: { stones: 20 },
                    effect: 'Unlocks engineers and improves trade',
                    priority: 4,
                    historical: 'Roman roads connected vast empires.',
                },
            ],
        },

        industrial: {
            id: 'industrial',
            name: 'Industrial Age',
            timespan: '1760 - 1840',
            description: 'The Industrial Revolution transforms society with steam power and mass production.',
            advancementCost: { population: 50000, electricity: 500, factories: 100 },
            workers: [
                {
                    id: 'factoryWorker',
                    name: 'Factory Worker',
                    description: 'Operates steam-powered machinery.',
                    cost: { coal: 50, steam: 20 },
                    produces: { factories: 1, steam: 1 },
                    interval: 8000,
                    requiresUpgrade: 'steamEngine',
                },
                {
                    id: 'inventor',
                    name: 'Inventor',
                    description: 'Develops new technologies.',
                    cost: { electricity: 40, factories: 15 },
                    produces: { electricity: 3, steam: 1 },
                    interval: 12000,
                    requiresUpgrade: 'electrification',
                },
            ],
            upgrades: [
                {
                    id: 'steamEngine',
                    name: 'Steam Engine',
                    description: 'Harness steam power for industry',
                    cost: { coal: 20, iron: 12 },
                    effect: 'Unlocks factory workers',
                    priority: 1,
                    historical: "James Watt's improved steam engine (1769) powered the Industrial Revolution.",
                },
                {
                    id: 'electrification',
                    name: 'Electrification',
                    description: 'Generate and distribute electrical energy',
                    cost: { coal: 10, copper: 8 },
                    effect: 'Unlocks inventors and advanced machinery',
                    priority: 2,
                    historical: "Edison's power station (1882) began the electrical age.",
                },
                {
                    id: 'bessemer',
                    name: 'Bessemer Steel',
                    description: 'Mass produce high-quality steel',
                    cost: { coal: 10, iron: 20 },
                    effect: 'Greatly increases steel production',
                    priority: 3,
                    historical: 'Bessemer process (1856) revolutionized steel manufacturing.',
                },
            ],
        },

        information: {
            id: 'information',
            name: 'Information Age',
            timespan: '1950 - 2020',
            description: 'The Digital Revolution brings computers, internet, and global connectivity.',
            advancementCost: { population: 200000, computers: 1000, internet: 500 },
            workers: [
                {
                    id: 'programmer',
                    name: 'Programmer',
                    description: 'Develops software and applications.',
                    cost: { silicon: 100, computers: 20 },
                    produces: { software: 3, data: 2 },
                    interval: 6000,
                    requiresUpgrade: 'siliconProcessing',
                },
                {
                    id: 'networkEngineer',
                    name: 'Network Engineer',
                    description: 'Builds global communication networks.',
                    cost: { computers: 50, internet: 15 },
                    produces: { internet: 2, data: 1 },
                    interval: 10000,
                    requiresUpgrade: 'networking',
                },
            ],
            upgrades: [
                {
                    id: 'siliconProcessing',
                    name: 'Silicon Processing',
                    description: 'Produce microchips from silicon',
                    cost: { steel: 8, electricity: 15 },
                    effect: 'Enables computer production',
                    priority: 1,
                    historical: 'Silicon Valley became the tech hub in the 1950s.',
                },
                {
                    id: 'microprocessor',
                    name: 'Microprocessor',
                    description: 'Create programmable computer chips',
                    cost: { silicon: 20 },
                    effect: 'Unlocks programmers',
                    priority: 2,
                    historical: 'Intel 4004 (1971) was the first microprocessor.',
                },
                {
                    id: 'networking',
                    name: 'Networking',
                    description: 'Connect computers globally',
                    cost: { computers: 10 },
                    effect: 'Unlocks network engineers and internet',
                    priority: 3,
                    historical: 'ARPANET (1969) evolved into the modern internet.',
                },
                {
                    id: 'softwareEngineering',
                    name: 'Software Engineering',
                    description: 'Systematic software development',
                    cost: { data: 20 },
                    effect: 'Improves software production',
                    priority: 4,
                    historical: 'Software engineering emerged as a discipline in the 1960s.',
                },
            ],
        },
    }
};