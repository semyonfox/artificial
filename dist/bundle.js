(function () {
    'use strict';

    const config = {
    // Resource display icons organized by historical era (fixed invalid/duplicate icons)
        resourceIcons: {
    // Paleolithic Era
            sticks: '🪵',
            stones: '🪨',
            meat: '🥩',
            cookedMeat: '🍖',
            bones: '🦴',
            fur: '🧥',
            fire: '🔥',
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
            paleolithic: ['sticks', 'stones', 'meat', 'cookedMeat', 'bones', 'fur', 'fire', 'population'],
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
                { key: 'fireMastery', name: 'Mastery of Fire', cost: { sticks: 10, stones: 5 }, effects: { unlocks: ['cookedMeat', 'campfire'], multipliers: { meat: 1.1 } } },
                { key: 'stoneKnapping', name: 'Stone Knapping', cost: { stones: 12 }, effects: { multipliers: { sticks: 1.2, stones: 1.3, meat: 1.2 } } },
                { key: 'clothing', name: 'Clothing', cost: { fur: 8, bones: 4 }, effects: { multipliers: { population: 1.05 }, workerBonus: { hunting: 0.1 } } },
                { key: 'cooking', name: 'Cooking', cost: { meat: 8, fire: 1 }, effects: { unlocks: ['cookedMeatRecipe'], multipliers: { population: 1.05, meat: 1.1 } } }
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
            cookedMeatRecipe: { inputs: { meat: 2, fire: 1 }, output: { cookedMeat: 2 } },
            potteryRecipe: { inputs: { clay: 3 }, output: { pottery: 2 } },
            bronzeRecipe: { inputs: { copper: 2, tin: 1 }, output: { bronze: 2 } },
            steelRecipe: { inputs: { iron: 2, coal: 1 }, output: { steel: 2 } }
        },

    // Progression gates: straightforward and minimal (population + key techs + small stockpile)
        eraRequirements: {
            paleolithic: { next: 'neolithic', require: { population: 15, techs: ['fireMastery', 'stoneKnapping'], stockpile: { cookedMeat: 10 } } },
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
            burnChance: 0.35,
            stoneChanceFromSticks: 0.2,
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
            notificationDuration: 3000,
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
        }
    };

    /**
     * GameState - Centralized state management for the Evolution Clicker game
     * Provides a clean interface for state access, validation, and persistence
     */


    class GameState {
    	constructor() {
    		this.data = this.createInitialState();
    		this.listeners = new Map();
    		this.lastSave = Date.now();

    		console.log('GameState initialized');
    	}

    	/**
    	 * Create the initial game state with all necessary properties
    	 */
    	createInitialState() {
    		return {
    			// Core game properties
    			currentEra: 'paleolithic',
    			gameStartTime: Date.now(),
    			totalPlayTime: 0,

    			// Resources - organized by era for better management
    			resources: this.createInitialResources(),

    			// Workers - all worker types across eras
    			workers: this.createInitialWorkers(),

    			// Upgrades - organized by era and status
    			upgrades: this.createInitialUpgrades(),

    			// Progress tracking
    			progression: {
    				eraProgress: 0,
    				totalResources: 0,
    				totalWorkers: 0,
    				totalUpgrades: 0,
    				achievements: [],
    			},

    			// Game settings
    			settings: {
    				autoSave: true,
    				notifications: true,
    				soundEnabled: true,
    				fastMode: false,
    			},
    		};
    	}

    	/**
    	 * Create initial resource state with all possible resources
    	 */
    	createInitialResources() {
    		const resources = {};

    		// Initialize all resources from config to 0, except starting resources
    		Object.keys(config.resourceIcons).forEach((resource) => {
    			resources[resource] = 0;
    		});

    		// Set starting resources for paleolithic era
    		resources.sticks = 10;
    		resources.stones = 5;
    		resources.population = 1;

    		return resources;
    	}

    	/**
    	 * Create initial worker state
    	 */
    	createInitialWorkers() {
    		const workers = {};

    		// Initialize all worker types from config
    		Object.keys(config.workerTimers).forEach((workerType) => {
    			workers[workerType] = 0;
    		});

    		return workers;
    	}

    	/**
    	 * Create initial upgrade state
    	 */
    	createInitialUpgrades() {
    		return {
    			// Paleolithic upgrades
    			fireControl: false,
    			stoneKnapping: false,
    			furClothing: false,
    			boneTools: false,
    			shelterBuilding: false,

    			// Neolithic upgrades
    			agriculture: false,
    			pottery: false,
    			animalDomestication: false,
    			weaving: false,
    			settlement: false,

    			// Bronze Age upgrades
    			bronzeWorking: false,
    			writing: false,
    			wheel: false,
    			urbanPlanning: false,
    			mathematics: false,

    			// Iron Age upgrades
    			ironWorking: false,
    			engineering: false,
    			philosophy: false,
    			coinage: false,
    			militaryTactics: false,

    			// Industrial Age upgrades
    			steamEngine: false,
    			railways: false,
    			electricity: false,
    			massProduction: false,
    			telegraphSystem: false,

    			// Information Age upgrades
    			programming: false,
    			internet: false,
    			dataAnalysis: false,
    			artificialIntelligence: false,
    			quantumComputing: false,
    		};
    	}

    	/**
    	 * Get a copy of the current state
    	 */
    	getState() {
    		return { ...this.data };
    	}

    	/**
    	 * Get a specific resource value
    	 */
    	getResource(resourceType) {
    		return this.data.resources[resourceType] || 0;
    	}

    	/**
    	 * Add resources with validation
    	 */
    	addResource(resourceType, amount) {
    		if (typeof amount !== 'number' || isNaN(amount)) {
    			console.warn(`Invalid amount for resource ${resourceType}:`, amount);
    			return false;
    		}

    		const oldValue = this.data.resources[resourceType] || 0;
    		const newValue = Math.max(0, oldValue + amount);
    		this.data.resources[resourceType] = newValue;

    		// Trigger resource change listeners
    		this.notifyListeners('resourceChange', {
    			resourceType,
    			oldValue,
    			newValue,
    			amount,
    		});

    		return true;
    	}

    	/**
    	 * Check if player can afford a cost
    	 */
    	canAfford(costs) {
    		if (!costs || typeof costs !== 'object') return true;

    		return Object.entries(costs).every(([resource, amount]) => {
    			return this.getResource(resource) >= amount;
    		});
    	}

    	/**
    	 * Spend resources if possible
    	 */
    	spendResources(costs) {
    		if (!this.canAfford(costs)) return false;

    		Object.entries(costs).forEach(([resource, amount]) => {
    			this.addResource(resource, -amount);
    		});

    		return true;
    	}

    	/**
    	 * Get worker count
    	 */
    	getWorkerCount(workerType) {
    		return this.data.workers[workerType] || 0;
    	}

    	/**
    	 * Add workers
    	 */
    	addWorker(workerType, count = 1) {
    		const oldCount = this.data.workers[workerType] || 0;
    		const newCount = oldCount + count;
    		this.data.workers[workerType] = Math.max(0, newCount);

    		this.notifyListeners('workerChange', {
    			workerType,
    			oldCount,
    			newCount,
    			count,
    		});
    		return true;
    	}

    	/**
    	 * Check if upgrade is unlocked
    	 */
    	hasUpgrade(upgradeId) {
    		return this.data.upgrades[upgradeId] === true;
    	}

    	/**
    	 * Unlock an upgrade
    	 */
    	unlockUpgrade(upgradeId) {
    		if (this.data.upgrades.hasOwnProperty(upgradeId)) {
    			const wasUnlocked = this.data.upgrades[upgradeId];
    			this.data.upgrades[upgradeId] = true;

    			if (!wasUnlocked) {
    				this.notifyListeners('upgradeUnlocked', { upgradeId });
    			}

    			return true;
    		}
    		return false;
    	}

    	/**
    	 * Get efficiency multiplier for a resource type
    	 */
    	getEfficiencyMultiplier(resourceType) {
    		let multiplier = 1.0;

    		// Apply simple global upgrade bonuses
    		if (this.data.upgrades.boneTools) {
    			multiplier *= 2.0;
    		}

    		if (this.data.upgrades.efficiency) {
    			multiplier *= 1 + this.data.upgrades.efficiency * 0.1;
    		}

    		// Apply resource-specific multipliers based on unlocked upgrades
    		const resourceMults = config.efficiencyMultipliers?.[resourceType];
    		if (resourceMults && typeof resourceMults === 'object') {
    			Object.entries(resourceMults).forEach(([upgradeId, mult]) => {
    				if (this.data.upgrades[upgradeId]) {
    					multiplier *= mult;
    				}
    			});
    		}

    		return multiplier;
    	}

    	/**
    	 * Get worker food consumption rate
    	 */
    	getWorkerFoodConsumption() {
    		const baseConsumption = config.gameVariables?.workerFoodConsumption;
    		const totalWorkers = Object.values(this.data.workers).reduce(
    			(sum, count) => sum + count,
    			0
    		);

    		return Math.max(0, totalWorkers * baseConsumption);
    	}

    	/**
    	 * Check if era advancement is possible
    	 */
    	canAdvanceEra() {
    		const req = config.balance?.eraProgressionRequirements || {};
    		const currentEra = this.data.currentEra;
    		const population = this.data.resources.population || 0;
    		const maxPop = config.balance?.maxPopulationPerEra?.[currentEra] || 100;

    		// Interpret populationMultiplier as a fraction target of max population.
    		const rawFraction = typeof req.populationMultiplier === 'number' ? req.populationMultiplier : 0.7;
    		const fraction = Math.max(0.1, Math.min(1, rawFraction));
    		const populationMet = population >= Math.floor(maxPop * fraction);

    		// Resource diversity: at least N different resources above 0
    		const resourceTypes = Object.keys(this.data.resources).filter(
    			(key) => this.data.resources[key] > 0
    		);
    		// If configured as fraction, map to a count baseline (default baseline 7)
    		const diversityFraction = typeof req.resourceDiversity === 'number' ? req.resourceDiversity : 0.5;
    		const baselineTypes = 7;
    		const requiredTypes = Math.max(3, Math.floor(baselineTypes * Math.max(0.1, Math.min(1, diversityFraction))));
    		const diversityMet = resourceTypes.length >= requiredTypes;

    		// Upgrades completion: simple count threshold
    		const completedUpgrades = Object.values(this.data.upgrades).filter(Boolean).length;
    		const upgradeFraction = typeof req.upgradeCompletion === 'number' ? req.upgradeCompletion : 0.4;
    		const requiredUpgrades = Math.max(2, Math.floor(5 * Math.max(0.1, Math.min(1, upgradeFraction))));
    		const upgradesMet = completedUpgrades >= requiredUpgrades;

    		return populationMet && diversityMet && upgradesMet;
    	}

    	/**
    	 * Get total resource value (for progression tracking)
    	 */
    	getTotalResourceValue() {
    		return Object.values(this.data.resources).reduce(
    			(sum, amount) => sum + amount,
    			0
    		);
    	}

    	/**
    	 * Register event listener
    	 */
    	addListener(event, callback) {
    		if (!this.listeners.has(event)) {
    			this.listeners.set(event, []);
    		}
    		this.listeners.get(event).push(callback);
    	}

    	/**
    	 * Remove event listener
    	 */
    	removeListener(event, callback) {
    		if (this.listeners.has(event)) {
    			const callbacks = this.listeners.get(event);
    			const index = callbacks.indexOf(callback);
    			if (index > -1) {
    				callbacks.splice(index, 1);
    			}
    		}
    	}

    	/**
    	 * Remove all event listeners
    	 */
    	removeAllListeners() {
    		this.listeners.clear();
    	}

    	/**
    	 * Notify listeners of state changes
    	 */
    	notifyListeners(event, data) {
    		if (this.listeners.has(event)) {
    			this.listeners.get(event).forEach((callback) => {
    				try {
    					callback(data);
    				} catch (error) {
    					console.error(`Error in ${event} listener:`, error);
    				}
    			});
    		}
    	}

    	/**
    	 * Validate game state integrity
    	 */
    	validate() {
    		const errors = [];

    		// Validate resources
    		Object.entries(this.data.resources).forEach(([resource, value]) => {
    			if (typeof value !== 'number' || isNaN(value) || value < 0) {
    				errors.push(`Invalid resource value: ${resource} = ${value}`);
    				this.data.resources[resource] = 0;
    			}
    		});

    		// Validate workers
    		Object.entries(this.data.workers).forEach(([worker, count]) => {
    			if (typeof count !== 'number' || isNaN(count) || count < 0) {
    				errors.push(`Invalid worker count: ${worker} = ${count}`);
    				this.data.workers[worker] = 0;
    			}
    		});

    		if (errors.length > 0) {
    			console.warn('Game state validation errors:', errors);
    		}

    		return errors.length === 0;
    	}

    	/**
    	 * Save game state to localStorage
    	 */
    	save() {
    		try {
    			const saveData = {
    				...this.data,
    				lastSave: Date.now(),
    			};

    			localStorage.setItem(config.storage.saveKey, JSON.stringify(saveData));
    			this.lastSave = Date.now();

    			console.log('Game saved successfully');
    			return true;
    		} catch (error) {
    			console.error('Failed to save game:', error);
    			return false;
    		}
    	}

    	/**
    	 * Load game state from localStorage
    	 */
    	load() {
    		try {
    			const saveData = localStorage.getItem(config.storage.saveKey);
    			if (!saveData) return false;

    			const parsedData = JSON.parse(saveData);

    			// Start from a fresh initial state
    			const initial = this.createInitialState();

    			// Shallow merge top-level
    			this.data = { ...initial, ...parsedData };

    			// Deep-merge critical nested objects to preserve default keys
    			this.data.resources = { ...initial.resources, ...(parsedData.resources || {}) };
    			this.data.workers = { ...initial.workers, ...(parsedData.workers || {}) };
    			this.data.upgrades = { ...initial.upgrades, ...(parsedData.upgrades || {}) };

    			// Migrate legacy save structures to current model
    			this.migrateLegacySave(parsedData);

    			// Validate loaded state
    			this.validate();

    			console.log('Game loaded successfully');
    			this.notifyListeners('gameLoaded', this.data);

    			return true;
    		} catch (error) {
    			console.error('Failed to load game:', error);
    			return false;
    		}
    	}

    	/**
    	 * Migrate older save formats to current schema, preserving player progress
    	 */
    	migrateLegacySave(parsedData) {
    		if (!parsedData || typeof parsedData !== 'object') return;

    		// 1) unlockedUpgrades array -> boolean flags in upgrades
    		if (Array.isArray(parsedData.unlockedUpgrades)) {
    			parsedData.unlockedUpgrades.forEach((upgradeId) => {
    				if (upgradeId && this.data.upgrades.hasOwnProperty(upgradeId)) {
    					this.data.upgrades[upgradeId] = true;
    				}
    			});
    			// Drop legacy field to avoid confusion
    			delete this.data.unlockedUpgrades;
    		}

    		// 2) Workers: legacy 'forager' -> current 'gatherer'
    		if (parsedData.workers && typeof parsedData.workers.forager === 'number') {
    			const count = parsedData.workers.forager;
    			this.data.workers.gatherer = (this.data.workers.gatherer || 0) + count;
    			// Remove legacy worker field if present
    			if (this.data.workers.forager !== undefined) delete this.data.workers.forager;
    		}

    		// 3) Resources: legacy rawMeat -> meat; hide -> fur
    		if (parsedData.resources) {
    			const r = parsedData.resources;
    			if (typeof r.rawMeat === 'number' && r.rawMeat > 0) {
    				this.data.resources.meat = (this.data.resources.meat || 0) + r.rawMeat;
    				if (this.data.resources.rawMeat !== undefined) delete this.data.resources.rawMeat;
    			}
    			if (typeof r.hide === 'number' && r.hide > 0) {
    				this.data.resources.fur = (this.data.resources.fur || 0) + r.hide;
    				if (this.data.resources.hide !== undefined) delete this.data.resources.hide;
    			}
    		}
    	}

    	/**
    	 * Reset game state to initial values
    	 */
    	reset() {
    		this.data = this.createInitialState();
    		this.notifyListeners('gameReset', this.data);
    		console.log('Game state reset');
    	}

    	/**
    	 * Get game statistics
    	 */
    	getStatistics() {
    		const totalResources = Object.values(this.data.resources).reduce(
    			(sum, val) => sum + val,
    			0
    		);
    		const totalWorkers = Object.values(this.data.workers).reduce(
    			(sum, val) => sum + val,
    			0
    		);
    		const totalUpgrades = Object.values(this.data.upgrades).filter(
    			Boolean
    		).length;

    		return {
    			totalResources,
    			totalWorkers,
    			totalUpgrades,
    			currentEra: this.data.currentEra,
    			playTime: this.data.totalPlayTime,
    		};
    	}
    }

    /**
     * Manages all resource-related operations in the game.
     * Handles resource gathering, processing, and worker production.
     */
    class ResourceManager {
    	/**
    	 * Creates a new ResourceManager instance.
    	 * @param {GameState} gameState - The game state instance
    	 */
    	constructor(gameState) {
    		this.gameState = gameState;
    		this.uiManager = null;
    		
    		console.log('ResourceManager initialized');
    	}

    	/**
    	 * Set UI Manager reference
    	 */
    	setUIManager(uiManager) {
    		this.uiManager = uiManager;
    	}

    	/**
    	 * Perform foraging action - gather sticks and occasionally stones
    	 */
    	forage() {
    		const baseYield = config.yields.forageYield;
    		const stickMultiplier = this.gameState.getEfficiencyMultiplier('sticks');
    		
    		// Calculate stick yield
    		const stickYield = Math.max(1, Math.floor(baseYield * stickMultiplier));
    		this.gameState.addResource('sticks', stickYield);
    		
    		// Chance for stones
    		if (Math.random() < config.probabilities.stoneChanceFromSticks) {
    			const stoneYield = Math.max(
    				1,
    				Math.floor(baseYield * 0.5 * this.gameState.getEfficiencyMultiplier('stones'))
    			);
    			this.gameState.addResource('stones', stoneYield);
    		}
    		
    		// Show notification
    		this.showGatheringResult('Foraged', { sticks: stickYield });
    		
    		return { sticks: stickYield };
    	}

    	/**
    	 * Hunt animals for meat, bones, and fur - requires stone knapping
    	 */
    	huntAnimal() {
    		if (!this.gameState.hasUpgrade('stoneKnapping')) {
    			this.uiManager?.showNotification('Need Stone Knapping to hunt!', 'warning');
    			return null;
    		}
    		
    		const baseYield = config.yields.huntYield;
    		const meatMultiplier = this.gameState.getEfficiencyMultiplier('meat');
    		
    		// Calculate yields
    		const meatYield = Math.max(1, Math.floor(baseYield * meatMultiplier));
    		const boneYield = Math.random() < 0.6 ? 1 : 0;
    		const furYield = Math.random() < config.probabilities.furDropChance ? 1 : 0;
    		
    		// Add resources
    		this.gameState.addResource('meat', meatYield);
    		if (boneYield > 0) this.gameState.addResource('bones', boneYield);
    		if (furYield > 0) this.gameState.addResource('fur', furYield);
    		
    		// Show notification
    		const results = { meat: meatYield };
    		if (boneYield > 0) results.bones = boneYield;
    		if (furYield > 0) results.fur = furYield;
    		
    		this.showGatheringResult('Hunted', results);
    		
    		return results;
    	}

    	/**
    	 * Cook raw meat into cooked meat - requires fire control
    	 */
    	cookMeatClick() {
    		if (!this.gameState.hasUpgrade('fireControl')) {
    			this.uiManager?.showNotification('Need Fire Control to cook!', 'warning');
    			return null;
    		}
    		
    		if (this.gameState.getResource('meat') < 1) {
    			this.uiManager?.showNotification('Need raw meat to cook!', 'warning');
    			return null;
    		}
    		
    		// Consume raw meat
    		this.gameState.addResource('meat', -1);
    		
    		// Chance of burning (failure)
    		if (Math.random() < config.probabilities.burnChance) {
    			this.uiManager?.showNotification('The meat burned while cooking!', 'error');
    			return { failed: true };
    		}
    		
    		// Successful cooking
    		const cookedYield = 2; // Cooking multiplies meat value
    		this.gameState.addResource('cookedMeat', cookedYield);
    		
    		// Maintain fire a bit
    		this.gameState.addResource('fire', 0.1);
    		
    		this.showGatheringResult('Cooked', { cookedMeat: cookedYield });
    		
    		return { cookedMeat: cookedYield };
    	}

    	/**
    	 * Process worker production for a specific worker type
    	 */
    	processWorkerProduction(workerType, workerData) {
    		const workerCount = this.gameState.getWorkerCount(workerType);
    		if (workerCount === 0) return null;
    		
    		let successfulWorkers = 0;
    		let failedWorkers = 0;
    		const totalProduction = {};
    		
    		for (let i = 0; i < workerCount; i++) {
    			const workerResult = this.processIndividualWorker(workerType, workerData);
    			
    			if (workerResult.success) {
    				successfulWorkers++;
    				
    				// Add to total production
    				Object.entries(workerResult.production).forEach(([resource, amount]) => {
    					totalProduction[resource] = (totalProduction[resource] || 0) + amount;
    				});
    			} else {
    				failedWorkers++;
    			}
    		}
    		
    		// Apply total production
    		Object.entries(totalProduction).forEach(([resource, amount]) => {
    			this.gameState.addResource(resource, amount);
    		});
    		
    		// Show results
    		if (successfulWorkers > 0) {
    			this.showWorkerResult(workerType, successfulWorkers, totalProduction);
    		}
    		
    		if (failedWorkers > 0) {
    			this.uiManager?.showNotification(
    				`${failedWorkers} ${workerData.name}(s) couldn't work (need resources)`,
    				'warning'
    			);
    		}
    		
    		return {
    			successfulWorkers,
    			failedWorkers,
    			totalProduction,
    		};
    	}

    	/**
    	 * Process production for a single worker
    	 */
    	processIndividualWorker(workerType, workerData) {
    		// Check if worker can consume required resources
    		if (workerData.consumes) {
    			if (!this.gameState.canAfford(workerData.consumes)) {
    				return { success: false, reason: 'insufficient_resources' };
    			}
    			
    			// Consume resources
    			this.gameState.spendResources(workerData.consumes);
    		}
    		
    		// Calculate production with efficiency bonuses
    		const production = {};
    		
    		if (workerData.produces) {
    			Object.entries(workerData.produces).forEach(([resource, baseAmount]) => {
    				const efficiency = this.gameState.getEfficiencyMultiplier(resource);
    				const actualAmount = baseAmount * efficiency;
    				production[resource] = actualAmount;
    			});
    		}
    		
    		return { success: true, production };
    	}

    	/**
    	 * Show gathering result notification
    	 */
    	showGatheringResult(action, results) {
    		if (!this.uiManager) return;
    		
    		const resultText = Object.entries(results)
    			.map(([resource, amount]) => `${amount} ${resource}`)
    			.join(', ');
    		
    		this.uiManager.showNotification(`${action}: +${resultText}`, 'success');
    	}

    	/**
    	 * Show worker production result
    	 */
    	showWorkerResult(workerType, count, production) {
    		if (!this.uiManager) return;
    		
    		const productionText = Object.entries(production)
    			.map(([resource, amount]) => `${Math.floor(amount * 10) / 10} ${resource}`)
    			.join(', ');
    		
    		this.uiManager.showNotification(
    			`${count} ${workerType}(s) produced: ${productionText}`,
    			'success'
    		);
    	}

    	/**
    	 * Calculate total resource value for progression tracking
    	 */
    	calculateTotalResourceValue() {
    		const state = this.gameState.getState();
    		let totalValue = 0;
    		
    		Object.entries(state.resources).forEach(([resource, amount]) => {
    			const weight = this.getResourceWeight(resource);
    			totalValue += amount * weight;
    		});
    		
    		return totalValue;
    	}

    	/**
    	 * Get resource weight for progression calculation
    	 */
    	getResourceWeight(resource) {
    		const weights = {
    			// Basic resources
    			sticks: 1,
    			stones: 2,
    			meat: 3,
    			cookedMeat: 5,
    			bones: 4,
    			fur: 6,
    			fire: 8,
    			population: 20,
    			
    			// Advanced resources have higher weights
    			grain: 10,
    			pottery: 15,
    			bronze: 25,
    			writing: 30,
    			steel: 40,
    			electricity: 60,
    			computers: 100,
    		};
    		
    		return weights[resource] || 10; // Default weight
    	}
    }

    /**
     * UI Manager - Handles all user interface updates and interactions
     */


    class UIManager {
    	constructor(gameState, gameManager) {
    		this.gameState = gameState;
    		this.gameManager = gameManager;

    		this.cacheElements();

    		// Create action buttons if container exists
    		if (this.elements.actionButtonsContainer) {
    			this.createActionButtons();
    		}

    		this.addEventListeners();
    		this.initLogMenu();

    		// Initial UI update
    		this.updateUI();

    		console.log('UIManager initialized');
    	}

    	/**
    	 * Cache DOM elements for performance
    	 */
    	cacheElements() {
    		this.elements = {
    			// Action buttons
    			actionButtonsContainer: document.getElementById(
    				'action-buttons-container'
    			),

    			// Resource display
    			resourceDisplay: document.getElementById('resource-display'),

    			// Era display
    			eraDisplay: document.getElementById('era-display'),
    			currentEraName: document.getElementById('current-era-name'),
    			eraProgress: document.getElementById('era-progress'),
    			nextEraButton: document.getElementById('next-era-button'),

    			// Workers
    			workersContainer: document.getElementById('workers-container'),
    			workerStatus: document.getElementById('worker-status'),

    			// Upgrades
    			upgradesContainer: document.getElementById('upgrades'),

    			// Logs
    			logMenu: document.getElementById('log-menu'),
    			logToggle: document.getElementById('log-toggle'),
    			eventLog: document.getElementById('event-log'),
    			disasterLog: document.getElementById('disaster-log'),

    			// Notifications
    			notificationContainer: document.getElementById('notification-container'),
    		};
    	}

    	/**
    	 * Create enhanced action buttons dynamically
    	 */
    	createActionButtons() {
    		this.elements.actionButtonsContainer.innerHTML = `
      <button id="forage-button" class="btn btn-outline-light d-flex align-items-center gap-2" title="Gather sticks and stones from the wilderness">
        <span class="button-icon">🪵</span>
        <span class="button-text text-start">
          <span class="button-title fw-semibold">Forage</span>
          <span class="button-desc d-block small text-secondary">Gather sticks</span>
        </span>
      </button>
      <button id="hunt-button" class="btn btn-outline-danger d-none d-flex align-items-center gap-2" title="Hunt animals for meat and materials">
        <span class="button-icon">🥩</span>
        <span class="button-text text-start">
          <span class="button-title fw-semibold">Hunt</span>
          <span class="button-desc d-block small text-secondary">Find meat</span>
        </span>
      </button>
      <button id="cook-button" class="btn btn-outline-warning d-none d-flex align-items-center gap-2" title="Cook raw meat to make it more nutritious">
        <span class="button-icon">🍗</span>
        <span class="button-text text-start">
          <span class="button-title fw-semibold">Cook</span>
          <span class="button-desc d-block small text-secondary">Prepare food</span>
        </span>
      </button>
    `;

    		// Cache the newly created elements
    		this.elements.forageButton = document.getElementById('forage-button');
    		this.elements.huntButton = document.getElementById('hunt-button');
    		this.elements.cookButton = document.getElementById('cook-button');
    	}

    	/**
    	 * Add event listeners
    	 */
    	addEventListeners() {
    		// Action buttons
    		if (this.elements.forageButton) {
    			this.elements.forageButton.addEventListener('click', () =>
    				this.gameManager.performAction(
    					this.elements.forageButton,
    					() => this.gameManager.forage(),
    					1000
    				)
    			);
    		}

    		if (this.elements.huntButton) {
    			this.elements.huntButton.addEventListener('click', () =>
    				this.gameManager.performAction(
    					this.elements.huntButton,
    					() => this.gameManager.findFood(),
    					1500
    				)
    			);
    		}

    		if (this.elements.cookButton) {
    			this.elements.cookButton.addEventListener('click', () =>
    				this.gameManager.performAction(
    					this.elements.cookButton,
    					() => this.gameManager.cookMeat(),
    					800
    				)
    			);
    		}

    		// Era advancement
    		if (this.elements.nextEraButton) {
    			this.elements.nextEraButton.addEventListener('click', () => {
    				this.gameManager.advanceEra();
    			});
    		}

    		// Log toggle
    		if (this.elements.logToggle) {
    			this.elements.logToggle.addEventListener('click', () => {
    				this.toggleLogMenu();
    			});
    		}
    	}

    	/**
    	 * Initialize log menu
    	 */
    	initLogMenu() {
    		if (this.elements.logMenu) {
    			this.elements.logMenu.classList.add('collapsed');
    		}
    	}

    	/**
    	 * Toggle log menu visibility
    	 */
    	toggleLogMenu() {
    		if (this.elements.logMenu) {
    			this.elements.logMenu.classList.toggle('collapsed');
    		}
    	}

    	/**
    	 * Main UI update method
    	 */
    	updateUI() {
    		this.updateResources();
    		this.updateEraDisplay();
    		this.updateActionButtons();
    		this.updateWorkers();
    		this.updateUpgrades();
    		this.updateEraProgression();
    	}

    	/**
    	 * Update resource display
    	 */
    	updateResources() {
    		if (!this.elements.resourceDisplay) return;

    		const gameData = this.gameState.getState();
    		const resources = gameData.resources;

    		this.elements.resourceDisplay.innerHTML = Object.entries(resources)
    			.filter(([_, value]) => value > 0)
    			.map(
    				([key, value]) => `
        <div class="list-group-item bg-dark text-light d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <span class="resource-icon">${config.resourceIcons[key] || '❓'}</span>
            <span class="resource-name">${this.formatResourceName(key)}</span>
          </div>
          <span class="badge bg-secondary rounded-pill" data-amount="${Math.floor(value)}">${this.formatNumber(Math.floor(value))}</span>
        </div>
      `
    			)
    			.join('');

    		// Optional: subtle animation hook remains
    		this.animateResourceChanges();
    	}

    	/**
    	 * Format resource names for better display
    	 */
    	formatResourceName(key) {
    		return key
    			.replace(/([A-Z])/g, ' $1')
    			.replace(/^./, (str) => str.toUpperCase());
    	}

    	/**
    	 * Format numbers with appropriate suffixes
    	 */
    	formatNumber(num) {
    		if (num >= 1000000) {
    			return (num / 1000000).toFixed(1) + 'M';
    		} else if (num >= 1000) {
    			return (num / 1000).toFixed(1) + 'K';
    		}
    		return num.toString();
    	}

    	/**
    	 * Animate resource changes
    	 */
    	animateResourceChanges() {
    		const resourceElements =
    			this.elements.resourceDisplay.querySelectorAll('.resource-item');
    		resourceElements.forEach((element, index) => {
    			element.style.animationDelay = `${index * 50}ms`;
    			element.classList.add('resource-fade-in');
    		});
    	}

    	/**
    	 * Update era display
    	 */
    	updateEraDisplay() {
    		const currentEraData = this.gameManager.getCurrentEraData();

    		if (this.elements.currentEraName && currentEraData) {
    			// Show era name and timespan
    			const eraText = currentEraData.timespan
    				? `${currentEraData.name} (${currentEraData.timespan})`
    				: currentEraData.name;
    			this.elements.currentEraName.textContent = eraText;

    			// Add era description as tooltip
    			if (currentEraData.description) {
    				this.elements.currentEraName.title = currentEraData.description;
    			}
    		}
    	}
    	/**
    	 * Update action buttons visibility and state
    	 */
    	updateActionButtons() {
    		const gameData = this.gameState.getState();
    		const currentEraData = this.gameManager.getCurrentEraData();

    		if (!currentEraData) return;

    		if (gameData.currentEra === 'paleolithic') {
    			const hasStoneKnapping = this.gameState.hasUpgrade('stoneKnapping');
    			const hasFireControl = this.gameState.hasUpgrade('fireControl');

    			if (this.elements.huntButton) {
    				this.elements.huntButton.classList.toggle('d-none', !hasStoneKnapping);
    				if (hasStoneKnapping) {
    					const huntDesc = this.elements.huntButton.querySelector('.button-desc');
    					if (huntDesc) huntDesc.textContent = 'Hunt with stone tools';
    				}
    			}

    			if (this.elements.cookButton) {
    				this.elements.cookButton.classList.toggle('d-none', !hasFireControl);
    				if (hasFireControl) {
    					this.elements.cookButton.disabled = (gameData.resources.meat || 0) <= 0;
    					const cookDesc = this.elements.cookButton.querySelector('.button-desc');
    					if (cookDesc) cookDesc.textContent = 'Cook with fire';
    				}
    			}
    		} else {
    			if (this.elements.forageButton) this.elements.forageButton.classList.add('d-none');
    			if (this.elements.huntButton) this.elements.huntButton.classList.add('d-none');
    			if (this.elements.cookButton) this.elements.cookButton.classList.add('d-none');
    		}
    	}

    	/**
    	 * Update workers display
    	 */
    	updateWorkers() {
    		if (!this.elements.workersContainer) return;

    		const gameData = this.gameState.getState();
    		const currentEraData = this.gameManager.getCurrentEraData();
    		if (!currentEraData || !currentEraData.workers) return;

    		this.elements.workersContainer.innerHTML = currentEraData.workers
    			.map((worker) => {
    				const workerCount = gameData.workers[worker.id] || 0;
    				const actualCost = this.gameManager.systems.workerManager.calculateWorkerCost(worker.cost, workerCount);
    				const canAfford = this.gameState.canAfford(actualCost);
    				const hasRequiredUpgrade = !worker.requiresUpgrade || this.gameState.hasUpgrade(worker.requiresUpgrade);
    				const canHire = canAfford && hasRequiredUpgrade;

    				let statusText = '';
    				if (!hasRequiredUpgrade) {
    					statusText = `<span class=\"text-warning small\">⚠️ Requires: ${worker.requiresUpgrade}</span>`;
    				} else if (!canAfford) {
    					statusText = `<span class=\"text-secondary small\">💰 Need more resources</span>`;
    				}

    				return `
					<div class="col">
						<div class="card h-100 bg-dark border-secondary ${!hasRequiredUpgrade ? 'opacity-50' : ''}">
							<div class="card-body d-flex flex-column">
								<h4 class="h6 card-title mb-1">${worker.name}</h4>
								<p class="card-text small text-secondary mb-2">${worker.description}</p>
								<p class="mb-1"><span class="text-secondary small">Cost:</span> ${this.formatCost(actualCost)}</p>
								<p class="mb-2"><span class="text-secondary small">Owned:</span> ${workerCount}</p>
								<div class="mt-auto d-flex justify-content-between align-items-center">
									${statusText}
									<button class="hire-button btn btn-sm ${canHire ? 'btn-primary' : 'btn-secondary'}" data-worker-type="${worker.id}" ${!canHire ? 'disabled' : ''}>
										${!hasRequiredUpgrade ? 'Locked' : `Hire ${worker.name}`}
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
    			})
    			.join('');

    		this.elements.workersContainer.querySelectorAll('.hire-button').forEach((button) => {
    			button.addEventListener('click', () => {
    				const workerType = button.dataset.workerType;
    				this.gameManager.hireWorker(workerType);
    			});
    		});

    		this.updateWorkerStatus();
    	}

    	/**
    	 * Update worker status display
    	 */
    	updateWorkerStatus() {
    		if (!this.elements.workerStatus) return;

    		const gameData = this.gameState.getState();
    		const workers = gameData.workers;

    		const workerStatusText = Object.entries(workers)
    			.filter(([_, count]) => count > 0)
    			.map(
    				([type, count]) =>
    					`${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`
    			)
    			.join(', ');

    		this.elements.workerStatus.textContent =
    			workerStatusText || 'No workers hired';
    	}

    	/**
    	 * Update upgrades display
    	 */
    	updateUpgrades() {
    		if (!this.elements.upgradesContainer) return;
    		const currentEraData = this.gameManager.getCurrentEraData();
    		if (!currentEraData || !currentEraData.upgrades) return;

    		this.elements.upgradesContainer.innerHTML = currentEraData.upgrades
    			.map((upgrade) => {
    				const isUnlocked = this.gameState.hasUpgrade(upgrade.id);
    				const canAfford = !isUnlocked && this.gameState.canAfford(upgrade.cost);
    				const cardState = isUnlocked ? 'border-success' : canAfford ? 'border-primary' : 'border-secondary';

    				const historicalInfo = upgrade.historical
    					? `<p class=\"small text-secondary mb-0\">📚 ${upgrade.historical}</p>`
    					: '';

    				return `
					<div class="col">
						<div class="card h-100 bg-dark ${cardState}">
							<div class="card-body d-flex flex-column">
								<h4 class="h6 card-title mb-1">${upgrade.name}</h4>
								<p class="card-text small text-secondary mb-2">${upgrade.description}</p>
								<p class="mb-1"><span class="text-secondary small">Cost:</span> ${this.formatCost(upgrade.cost)}</p>
								<p class="mb-2"><span class="text-secondary small">Effect:</span> ${upgrade.effect}</p>
								${historicalInfo}
								<div class="mt-auto">
									<button class="upgrade-button btn btn-sm ${isUnlocked ? 'btn-success' : canAfford ? 'btn-primary' : 'btn-secondary'}" data-upgrade-id="${upgrade.id}" ${isUnlocked || !canAfford ? 'disabled' : ''}>
										${isUnlocked ? 'Purchased' : 'Buy'}
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
    			})
    			.join('');

    		this.elements.upgradesContainer.querySelectorAll('.upgrade-button').forEach((button) => {
    			if (!button.disabled) {
    				button.addEventListener('click', () => {
    					const upgradeId = button.dataset.upgradeId;
    					this.gameManager.buyUpgrade(upgradeId);
    				});
    			}
    		});
    	}

    	/**
    	 * Update era progression display and advancement button
    	 */
    	updateEraProgression() {
    		if (!this.elements.nextEraButton) return;
    		const canAdvance = this.gameState.canAdvanceEra();
    		this.elements.nextEraButton.disabled = !canAdvance;
    		this.elements.nextEraButton.classList.toggle('btn-success', canAdvance);
    		this.elements.nextEraButton.classList.toggle('btn-secondary', !canAdvance);
    		this.elements.nextEraButton.style.display = 'block';
    		this.elements.nextEraButton.textContent = canAdvance ? 'Advance Era' : 'Advance Era (requirements not met)';
    		this.elements.nextEraButton.classList.toggle('affordable', canAdvance);
    	}

    	/**
    	 * Format cost object for display
    	 */
    	formatCost(cost) {
    		return Object.entries(cost)
    			.map(
    				([resource, amount]) =>
    					`${amount} ${config.resourceIcons[resource] || resource}`
    			)
    			.join(', ');
    	}

    	/**
    	 * Show notification to user
    	 */
    	showNotification(message, type = 'success', duration = 3000) {
    		if (!this.elements.notificationContainer) return;

    		const notification = document.createElement('div');
    		notification.className = `notification notification-${type}`;
    		notification.textContent = message;

    		this.elements.notificationContainer.appendChild(notification);

    		// Trigger animation
    		setTimeout(() => notification.classList.add('show'), 10);

    		// Remove notification
    		setTimeout(() => {
    			notification.classList.remove('show');
    			setTimeout(() => notification.remove(), 300);
    		}, duration);
    	}

    	/**
    	 * Log an event
    	 */
    	logEvent(event) {
    		if (!this.elements.eventLog) return;

    		const logEntry = document.createElement('div');
    		logEntry.className = 'log-entry';
    		logEntry.innerHTML = `
      <h4>${event.name}</h4>
      <p>${event.impact}</p>
      <p>Effect: ${event.effect}</p>
      <small>${new Date().toLocaleTimeString()}</small>
    `;

    		this.elements.eventLog.appendChild(logEntry);
    		this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight;
    	}

    	/**
    	 * Log a disaster
    	 */
    	logDisaster(disaster) {
    		if (!this.elements.disasterLog) return;

    		const logEntry = document.createElement('div');
    		logEntry.className = 'log-entry disaster';
    		logEntry.innerHTML = `
      <h4>${disaster.name}</h4>
      <p>${disaster.impact}</p>
      <p>Effect: ${disaster.effect}</p>
      <small>${new Date().toLocaleTimeString()}</small>
    `;

    		this.elements.disasterLog.appendChild(logEntry);
    		this.elements.disasterLog.scrollTop =
    			this.elements.disasterLog.scrollHeight;
    	}

    	/**
    	 * Update worker progress bar
    	 */
    	updateWorkerProgress(workerType, progress, maxProgress) {
    		// This method can be implemented for worker progress visualization
    		// For now, it's a placeholder
    	}
    }

    /**
     * Worker Manager - Handles automated worker systems
     * Manages hiring, feeding, and production of workers
     */


    class WorkerManager {
    	constructor(gameState) {
    		this.gameState = gameState;
    		this.uiManager = null;
    		this.gameManager = null;
    		this.workerIntervals = new Map();
    		this.workerTimers = new Map();

    		console.log('WorkerManager initialized');
    	}

    	/**
    	 * Set UI manager reference
    	 */
    	setUIManager(uiManager) {
    		this.uiManager = uiManager;
    	}

    	/**
    	 * Set game manager reference
    	 */
    	setGameManager(gameManager) {
    		this.gameManager = gameManager;
    	}

    	/**
    	 * Update method called from game loop
    	 */
    	update(deltaTime) {
    		// Update worker timers and check for completed work
    		// This is handled by intervals, but we could add additional logic here
    	}

    	/**
    	 * Hire a new worker
    	 */
    	hireWorker(workerType) {
    		const gameData = this.gameState.getState();

    		// Get worker data from GameManager
    		if (!this.gameManager) {
    			this.uiManager?.showNotification('GameManager not available', 'error');
    			return false;
    		}

    		const currentEraData = this.gameManager.getCurrentEraData();

    		if (!currentEraData || !currentEraData.workers) {
    			this.uiManager?.showNotification(
    				'No workers available in this era',
    				'error'
    			);
    			return false;
    		}

    		const workerData = currentEraData.workers.find((w) => w.id === workerType);
    		if (!workerData) {
    			this.uiManager?.showNotification('Worker type not found', 'error');
    			return false;
    		}

    		// Check upgrade requirements
    		if (
    			workerData.requiresUpgrade &&
    			!gameData.upgrades[workerData.requiresUpgrade]
    		) {
    			this.uiManager?.showNotification(
    				`${workerData.name} requires the ${workerData.requiresUpgrade} upgrade!`,
    				'error'
    			);
    			return false;
    		}

    		// Calculate cost (increases with each worker)
    		const currentCount = gameData.workers[workerType] || 0;
    		const cost = this.calculateWorkerCost(workerData.cost, currentCount);

    		// Check if player can afford it
    		if (!this.gameState.canAfford(cost)) {
    			this.uiManager?.showNotification(
    				`Cannot afford ${workerData.name}`,
    				'error'
    			);
    			return false;
    		}

    		// Spend resources and hire worker
    		if (this.gameState.spendResources(cost)) {
    			this.gameState.addWorker(workerType, 1);

    			// Start worker automation
    			this.startWorkerAutomation(workerType, workerData);

    			this.uiManager?.showNotification(`Hired ${workerData.name}!`, 'success');

    			return true;
    		}

    		return false;
    	}

    	/**
    	 * Calculate worker cost with scaling
    	 */
    	calculateWorkerCost(baseCost, workerCount) {
    		const multiplier = Math.pow(1.5, workerCount);
    		const cost = {};

    		Object.entries(baseCost).forEach(([resource, amount]) => {
    			cost[resource] = Math.ceil(amount * multiplier);
    		});

    		return cost;
    	}

    	/**
    	 * Start automated worker production
    	 */
    	startWorkerAutomation(workerType, workerData) {
    		// Clear existing interval if any
    		this.stopWorkerAutomation(workerType);

    		const interval = workerData.interval || 10000; // Default 10 seconds

    		const workFunction = () => {
    			this.performWorkerWork(workerType, workerData);
    		};

    		// Start immediate work and set up interval
    		workFunction();
    		const intervalId = setInterval(workFunction, interval);
    		this.workerIntervals.set(workerType, intervalId);
    	}

    	/**
    	 * Stop worker automation
    	 */
    	stopWorkerAutomation(workerType) {
    		const intervalId = this.workerIntervals.get(workerType);
    		if (intervalId) {
    			clearInterval(intervalId);
    			this.workerIntervals.delete(workerType);
    		}
    	}

    	/**
    	 * Perform work for a specific worker type
    	 */
    	performWorkerWork(workerType, workerData) {
    		const gameData = this.gameState.getState();
    		const workerCount = gameData.workers[workerType] || 0;

    		if (workerCount === 0) {
    			this.stopWorkerAutomation(workerType);
    			return;
    		}

    		// Check worker food status and efficiency
    		const foodStatus = this.updateWorkerFoodConsumption();
    		const efficiency = this.getWorkerEfficiency(foodStatus);

    		let workersWorked = 0;
    		let unfedWorkers = 0;

    		// Process each worker
    		for (let i = 0; i < workerCount; i++) {
    			// Check if worker needs input resources (for cooks)
    			if (workerData.consumes) {
    				let canWork = true;
    				for (const [resource, amount] of Object.entries(workerData.consumes)) {
    					if ((gameData.resources[resource] || 0) < amount) {
    						canWork = false;
    						break;
    					}
    				}

    				if (!canWork) {
    					unfedWorkers++;
    					continue;
    				}

    				// Consume required resources
    				for (const [resource, amount] of Object.entries(workerData.consumes)) {
    					this.gameState.addResource(resource, -amount);
    				}
    			}

    			// Worker works and produces resources with efficiency modifier
    			if (workerData.produces) {
    				for (const [resource, amount] of Object.entries(workerData.produces)) {
    					const effectiveAmount = Math.floor(amount * efficiency);
    					this.gameState.addResource(resource, effectiveAmount);
    				}
    			}

    			workersWorked++;
    		}

    		// Show notification about work done
    		if (workersWorked > 0) {
    			const produced = Object.entries(workerData.produces || {})
    				.map(([resource, amount]) => {
    					const effectiveAmount = Math.floor(
    						amount * efficiency * workersWorked
    					);
    					return `${effectiveAmount} ${resource}`;
    				})
    				.join(', ');

    			if (produced) {
    				let message = `${workersWorked} ${workerData.name}(s) produced: ${produced}`;
    				if (efficiency < 1.0) {
    					message += ` (${Math.round(
						efficiency * 100
					)}% efficiency due to food shortage)`;
    				}

    				this.uiManager?.showNotification(message, 'success');
    			}
    		}

    		// Show notification for workers that couldn't work
    		if (unfedWorkers > 0) {
    			const missingResources = Object.keys(workerData.consumes || {}).join(
    				', '
    			);
    			this.uiManager?.showNotification(
    				`${unfedWorkers} ${workerData.name}(s) need ${missingResources} to work`,
    				'warning'
    			);
    		}

    		this.uiManager?.updateUI();
    	}

    	/**
    	 * Feed a worker (check for required resources)
    	 */
    	feedWorker(workerData) {
    		const gameData = this.gameState.getState();

    		// Check if worker needs input resources
    		if (workerData.inputRequired) {
    			for (const [resource, amount] of Object.entries(
    				workerData.inputRequired
    			)) {
    				if ((gameData.resources[resource] || 0) < amount) {
    					return false;
    				}
    			}

    			// Consume input resources
    			for (const [resource, amount] of Object.entries(
    				workerData.inputRequired
    			)) {
    				this.gameState.addResource(resource, -amount);
    			}
    		}

    		// Standard worker feeding with cooked meat
    		if ((gameData.resources.cookedMeat || 0) >= 1) {
    			this.gameState.addResource('cookedMeat', -1);
    			return true;
    		}

    		return false;
    	}

    	/**
    	 * Produce resources from worker
    	 */
    	produceResources(workerData) {
    		// Base production
    		if (workerData.baseProduction) {
    			for (const [resource, amount] of Object.entries(
    				workerData.baseProduction
    			)) {
    				this.gameState.addResource(resource, amount);
    			}
    		}

    		// Bonus production (with probability)
    		if (workerData.bonusProduction) {
    			for (const [resource, chance] of Object.entries(
    				workerData.bonusProduction
    			)) {
    				if (Math.random() < chance) {
    					this.gameState.addResource(resource, 1);
    				}
    			}
    		}

    		// Handle failure chance (for cooks)
    		if (workerData.failureChance && Math.random() < workerData.failureChance) {
    			// Production failed, maybe show notification
    			this.uiManager?.showNotification(
    				'A worker failed at their task!',
    				'warning',
    				1000
    			);
    		}
    	}

    	/**
    	 * Start all worker automations for current era
    	 */
    	startAllWorkerAutomations() {
    		const gameData = this.gameState.getState();
    		const currentEraData = this.getCurrentEraData();

    		if (!currentEraData || !currentEraData.workers) return;

    		// Start automation for all workers that have been hired
    		currentEraData.workers.forEach((workerData) => {
    			const workerCount = gameData.workers[workerData.id] || 0;
    			if (workerCount > 0) {
    				this.startWorkerAutomation(workerData.id, workerData);
    			}
    		});
    	}

    	/**
    	 * Stop all worker automations
    	 */
    	stopAllWorkerAutomations() {
    		this.workerIntervals.forEach((intervalId, workerType) => {
    			clearInterval(intervalId);
    		});
    		this.workerIntervals.clear();
    	}

    	/**
    	 * Stop all worker automation
    	 */
    	stopAllWorkers() {
    		for (const intervalId of this.workerIntervals.values()) {
    			clearInterval(intervalId);
    		}
    		this.workerIntervals.clear();
    		console.log('All worker automation stopped');
    	}

    	/**
    	 * Restart automation for all active workers
    	 */
    	restartAllWorkers() {
    		const gameData = this.gameState.getState();

    		if (!this.gameManager) {
    			console.warn('Cannot restart workers: GameManager not available');
    			return;
    		}

    		const currentEraData = this.gameManager.getCurrentEraData();
    		if (!currentEraData || !currentEraData.workers) {
    			return;
    		}

    		// Stop all existing automation first
    		this.stopAllWorkers();

    		// Restart automation for each worker type that has active workers
    		Object.entries(gameData.workers).forEach(([workerType, count]) => {
    			if (count > 0) {
    				const workerData = currentEraData.workers.find(
    					(w) => w.id === workerType
    				);
    				if (workerData) {
    					this.startWorkerAutomation(workerType, workerData);
    				}
    			}
    		});

    		console.log('Worker automation restarted for active workers');
    	}

    	/**
    	 * Get current era data (helper method)
    	 */
    	getCurrentEraData() {
    		// Get era data from GameManager if available
    		if (this.gameManager && this.gameManager.getCurrentEraData) {
    			return this.gameManager.getCurrentEraData();
    		}

    		// Fallback to basic paleolithic data
    		const gameData = this.gameState.getState();
    		const currentEra = gameData.currentEra;

    		if (currentEra === 'paleolithic') {
    			return {
    				workers: [
    					{
    						id: 'gatherer',
    						name: 'Gatherer',
    						cost: { sticks: 8, cookedMeat: 2 },
    						produces: { sticks: 1, stones: 0.3 },
    						interval: 4000,
    					},
    					{
    						id: 'hunter',
    						name: 'Hunter',
    						cost: { stones: 12, bones: 3, cookedMeat: 4 },
    						produces: { meat: 1, bones: 0.4, fur: 0.3 },
    						interval: 6000,
    						requiresUpgrade: 'stoneKnapping',
    					},
    					{
    						id: 'cook',
    						name: 'Cook',
    						cost: { sticks: 15, stones: 3, fire: 1, cookedMeat: 1 },
    						produces: { cookedMeat: 2, fire: 0.1 },
    						consumes: { meat: 1 },
    						interval: 3000,
    						requiresUpgrade: 'fireControl',
    					},
    				],
    			};
    		}

    		return null;
    	}

    	/**
    	 * Update worker food consumption
    	 */
    	updateWorkerFoodConsumption() {
    		const gameData = this.gameState.getState();
    		const foodConsumption = this.gameState.getWorkerFoodConsumption();

    		if (foodConsumption > 0) {
    			const availableFood = gameData.resources.cookedMeat || 0;

    			if (availableFood >= foodConsumption) {
    				// Workers are well fed
    				this.gameState.addResource('cookedMeat', -foodConsumption);
    				return 'wellFed';
    			} else if (availableFood > 0) {
    				// Workers are partially fed
    				this.gameState.addResource('cookedMeat', -availableFood);
    				return 'hungry';
    			} else {
    				// Workers are starving
    				return 'starving';
    			}
    		}

    		return 'wellFed';
    	}

    	/**
    	 * Get worker efficiency based on food status
    	 */
    	getWorkerEfficiency(foodStatus = 'wellFed') {
    		const efficiencyRates = config.balance?.workerEfficiency;
    		if (!efficiencyRates) return 1.0;

    		return efficiencyRates[foodStatus] || 1.0;
    	}

    	/**
    	 * Get detailed worker information for UI
    	 */
    	getWorkerInfo(workerType) {
    		if (!this.gameManager) return null;

    		const currentEraData = this.gameManager.getCurrentEraData();
    		const workerData = currentEraData?.workers?.find(
    			(w) => w.id === workerType
    		);
    		const gameData = this.gameState.getState();
    		const count = gameData.workers[workerType] || 0;

    		if (!workerData) return null;

    		return {
    			...workerData,
    			count,
    			cost: this.calculateWorkerCost(workerData.cost, count),
    			canHire: this.gameState.canAfford(
    				this.calculateWorkerCost(workerData.cost, count)
    			),
    			requirementMet:
    				!workerData.requiresUpgrade ||
    				gameData.upgrades[workerData.requiresUpgrade],
    		};
    	}

    	/**
    	 * Cleanup all worker systems
    	 */
    	destroy() {
    		this.stopAllWorkerAutomations();
    	}
    }

    /**
     * Event Manager - Handles historical events, disasters, and discoveries
     * Provides educational content based on historical periods
     */


    class EventManager {
    	constructor(gameState) {
    		this.gameState = gameState;
    		this.uiManager = null;
    		this.lastEventTime = 0;
    		this.eventCooldown = 60000; // 1 minute between possible events

    		console.log('EventManager initialized');
    	}

    	/**
    	 * Set UI manager reference
    	 */
    	setUIManager(uiManager) {
    		this.uiManager = uiManager;
    	}

    	/**
    	 * Update method called from game loop
    	 */
    	update(currentTime) {
    		if (currentTime - this.lastEventTime > this.eventCooldown) {
    			this.checkForRandomEvent();
    			this.lastEventTime = currentTime;
    		}
    	}

    	/**
    	 * Check if a random event should occur
    	 */
    	checkForRandomEvent() {
    		const gameData = this.gameState.getState();
    		const currentEra = gameData.currentEra;

    		// Only trigger events if we have enough population/progress
    		const population = gameData.resources.population || 1;
    		const minPopulation = this.getMinimumPopulationForEvents(currentEra);

    		if (population < minPopulation) return;

    		// Scale event probability with population and era progress
    		const scaledEventChance = this.calculateEventProbability(
    			population,
    			currentEra
    		);

    		if (Math.random() < scaledEventChance) {
    			this.triggerRandomEvent(currentEra);
    		}
    	}

    	/**
    	 * Get minimum population required for events in each era
    	 */
    	getMinimumPopulationForEvents(era) {
    		const minimums = {
    			paleolithic: 2,
    			neolithic: 5,
    			bronze: 10,
    			iron: 20,
    			industrial: 50,
    			information: 100,
    		};
    		return minimums[era] || 2;
    	}

    	/**
    	 * Calculate event probability based on population and era
    	 */
    	calculateEventProbability(population, era) {
    		const baseChance = config.probabilities.eventChance;
    		const populationFactor = Math.min(2.0, 1 + (population / 100) * 0.1);

    		// Later eras have more frequent events
    		const eraMultipliers = {
    			paleolithic: 0.8,
    			neolithic: 1.0,
    			bronze: 1.2,
    			iron: 1.3,
    			industrial: 1.5,
    			information: 1.8,
    		};

    		const eraFactor = eraMultipliers[era] || 1.0;
    		return baseChance * populationFactor * eraFactor;
    	}

    	/**
    	 * Trigger a random historical event for the current era
    	 */
    	triggerRandomEvent(era) {
    		const events = config.events[era];
    		if (!events || events.length === 0) return;

    		const randomEvent = events[Math.floor(Math.random() * events.length)];
    		this.executeEvent(randomEvent);
    	}

    	/**
    	 * Execute an event and apply its effects
    	 */
    	executeEvent(event) {
    		// Apply resource effects as percentage of current amount
    		if (event.effect) {
    			Object.entries(event.effect).forEach(([resource, change]) => {
    				const currentAmount = this.gameState.data.resources[resource] || 0;
    				const magnitude = Math.floor(currentAmount * Math.abs(change));
    				if (magnitude === 0) return;

    				if (change >= 0) {
    					this.gameState.addResource(resource, magnitude);
    				} else {
    					this.gameState.addResource(resource, -magnitude);
    				}
    			});
    		}

    		// Show notification based on event type
    		const notificationType =
    			event.type === 'disaster'
    				? 'error'
    				: event.type === 'discovery'
    				? 'info'
    				: 'success';

    		this.uiManager?.showNotification(
    			`${this.getEventIcon(event.type)} ${event.name}: ${event.description}`,
    			notificationType,
    			6000
    		);

    		// Log the event
    		this.logEvent(event);
    	}

    	/**
    	 * Get appropriate icon for event type
    	 */
    	getEventIcon(type) {
    		switch (type) {
    			case 'disaster':
    				return '⚠️';
    			case 'discovery':
    				return '🔍';
    			case 'breakthrough':
    				return '💡';
    			default:
    				return '📜';
    		}
    	}

    	/**
    	 * Log event to game history (placeholder for future log system)
    	 */
    	logEvent(event) {
    		// This could be expanded to maintain a history of events
    		console.log(`Historical Event: ${event.name} - ${event.description}`);
    	}

    	/**
    	 * Manually trigger a specific event (for testing or story purposes)
    	 */
    	triggerEvent(eventName, era = null) {
    		const gameData = this.gameState.getState();
    		const currentEra = era || gameData.currentEra;
    		const events = config.events[currentEra];

    		if (events) {
    			const event = events.find((e) => e.name === eventName);
    			if (event) {
    				this.executeEvent(event);
    			}
    		}
    	}

    	/**
    	 * Get historical information about the current era
    	 */
    	getEraInfo(era) {
    		return config.eras[era] || null;
    	}

    	/**
    	 * Cleanup
    	 */
    	destroy() {
    		// Cleanup if needed
    	}
    }

    /**
     * Game Manager - Main game coordination system
     * Handles game logic, progression, and system coordination
     */


    class GameManager {
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

    		// Auto-save every interval
    		this.autoSaveInterval = setInterval(() => {
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
    			// Unlock via GameState API
    			this.gameState.unlockUpgrade(upgradeId);
    			// Apply any side effects
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
    	 * Apply upgrade effects (side effects only; unlocking handled by GameState)
    	 */
    	applyUpgradeEffect(upgrade) {
    		console.log(`Applied upgrade: ${upgrade.name}`);

    		switch (upgrade.id) {
    			case 'stoneKnapping':
    				this.systems.uiManager?.showNotification(
    					'Stone knapping mastered! Better tools and hunting unlocked!',
    					'info',
    					4000
    				);
    				break;
    			case 'fireControl':
    				// Provide initial fire resource
    				this.gameState.addResource('fire', 1);
    				this.systems.uiManager?.showNotification(
    					'Fire mastered! Cooking unlocked and warmth provided!',
    					'info',
    					4000
    				);
    				break;
    			case 'boneTools':
    				this.systems.uiManager?.showNotification(
    					'Bone tools crafted! Gathering efficiency improved!',
    					'success',
    					4000
    				);
    				break;
    			case 'furClothing':
    				this.systems.uiManager?.showNotification(
    					'Fur clothing created! Your people can survive harsher climates.',
    					'info',
    					4000
    				);
    				break;
    			case 'shelterBuilding':
    				this.systems.uiManager?.showNotification(
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
    		if (this.gameState && this.gameState.data) {
    			this.gameState.data.progression = {
    				...this.gameState.data.progression,
    				totalClicks: (this.gameState.data.progression.totalClicks || 0) + amount,
    			};
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
    		this.getCurrentEraData();

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

    /**
     * Main Game Entry Point
     * Simplified initialization for immediate game start
     */


    class Game {
    	constructor() {
    		this.gameManager = null;
    		this.gameStarted = false;
    		this.currentSceneIndex = 0;
    		this.scenes = [];

    		this.init();
    	}

    	/**
    	 * Initialize the game immediately
    	 */
    	init() {
    		console.log('🎮 Starting Evolution Clicker...');
    		console.log('DOM readyState:', document.readyState);

    		// Show cutscenes
    		this.showCutscenes();
    	}

    	/**
    	 * Show cutscenes with proper scene transitions
    	 */
    	showCutscenes() {
    		console.log('🎬 Showing cutscenes...');

    		const cutsceneContainer = document.getElementById('cutscene-container');
    		const gameContainer = document.getElementById('game-container');

    		console.log('Cutscene container found:', !!cutsceneContainer);
    		console.log('Game container found:', !!gameContainer);

    		if (!cutsceneContainer) {
    			console.error('❌ Cutscene container not found!');
    			this.startMainGame();
    			return;
    		}

    		if (gameContainer) {
    			gameContainer.classList.add('d-none');
    		}

    		// Show cutscene container (remove d-none if present)
    		cutsceneContainer.classList.remove('d-none');

    		// Get all scenes
    		this.scenes = Array.from(cutsceneContainer.querySelectorAll('.scene'));
    		console.log(`Found ${this.scenes.length} scenes:`, this.scenes);

    		if (this.scenes.length === 0) {
    			console.warn('⚠️ No scenes found, starting game immediately');
    			this.startMainGame();
    			return;
    		}

    		// Show first scene
    		this.currentSceneIndex = 0;
    		this.showScene(0);

    		// Use event delegation on the container instead of individual buttons
    		// This ensures events work even if buttons are hidden/shown dynamically
    		cutsceneContainer.addEventListener('click', (e) => {
    			// Check if the clicked element is a scene-next button or inside one
    			const button = e.target.closest('.scene-next');
    			if (button) {
    				console.log('🖱️ Scene next button clicked via delegation');
    				e.preventDefault();
    				e.stopPropagation();
    				this.nextScene();
    			}
    		});

    		console.log('✅ Event delegation set up on cutscene container');

    		// Update progress bar
    		this.updateSceneProgress();
    	}

    	/**
    	 * Show a specific scene
    	 */
    	showScene(index) {
    		console.log(`🎬 Attempting to show scene ${index + 1}`);

    		// Hide all scenes using Bootstrap classes
    		this.scenes.forEach((scene, i) => {
    			scene.classList.remove('active');
    			scene.classList.add('d-none');
    			console.log(`  Scene ${i + 1} hidden`);
    		});

    		// Show current scene
    		if (this.scenes[index]) {
    			this.scenes[index].classList.remove('d-none');
    			this.scenes[index].classList.add('active');
    			console.log(`✅ Scene ${index + 1} of ${this.scenes.length} is now visible`);
    			console.log('  Scene classes:', this.scenes[index].className);
    		}

    		this.updateSceneProgress();
    	}

    	/**
    	 * Go to next scene or start game
    	 */
    	nextScene() {
    		console.log(`📍 Current scene index: ${this.currentSceneIndex}`);
    		this.currentSceneIndex++;
    		console.log(`📍 Moving to scene index: ${this.currentSceneIndex}`);

    		if (this.currentSceneIndex >= this.scenes.length) {
    			// All scenes done, start game
    			console.log('🎬 All cutscenes complete, starting game...');
    			this.startMainGame();
    		} else {
    			// Show next scene
    			console.log(`🎬 Showing next scene (${this.currentSceneIndex + 1}/${this.scenes.length})`);
    			this.showScene(this.currentSceneIndex);
    		}
    	}

    	/**
    	 * Update scene progress bar
    	 */
    	updateSceneProgress() {
    		const progressBar = document.querySelector('#cutscene-container .progress-bar');
    		if (progressBar && this.scenes.length > 0) {
    			const progress = ((this.currentSceneIndex + 1) / this.scenes.length) * 100;
    			progressBar.style.width = `${progress}%`;
    			console.log(`📊 Progress updated: ${progress}%`);
    		} else {
    			console.warn('⚠️ Progress bar not found or no scenes');
    		}
    	}

    	/**
    	 * Start the main game
    	 */
    	startMainGame() {
    		if (this.gameStarted) {
    			console.log('⚠️ Game already started, ignoring...');
    			return;
    		}

    		this.gameStarted = true;
    		console.log('🚀 Starting main game...');

    		try {
    			// Hide cutscene, show game using Bootstrap classes
    			const cutsceneContainer = document.getElementById('cutscene-container');
    			const gameContainer = document.getElementById('game-container');

    			console.log('Switching from cutscene to game...');

    			if (cutsceneContainer) {
    				cutsceneContainer.classList.add('d-none');
    				console.log('✅ Cutscene hidden');
    			}

    			if (gameContainer) {
    				gameContainer.classList.remove('d-none');
    				console.log('✅ Game container shown');
    			}

    			// Initialize the main game manager
    			console.log('🎮 Initializing GameManager...');
    			this.gameManager = new GameManager();

    			// Make game globally accessible for debugging
    			window.game = this.gameManager;

    			console.log('✅ Game started successfully!');
    			console.log('Game object:', this.gameManager);
    		} catch (error) {
    			console.error('❌ Failed to start game:', error);
    			this.showErrorMessage(error);
    		}
    	}

    	/**
    	 * Show error message to user
    	 */
    	showErrorMessage(error) {
    		const errorDiv = document.createElement('div');
    		errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 10000;
      max-width: 500px;
      text-align: center;
    `;
    		errorDiv.innerHTML = `
      <h3>Game Failed to Start</h3>
      <p>${error.message}</p>
      <p style="font-size: 12px; margin-top: 10px;">Check console for details (F12)</p>
    `;
    		document.body.appendChild(errorDiv);
    	}
    }

    // Start the game when DOM is ready
    if (document.readyState === 'loading') {
    	console.log('⏳ Waiting for DOM to load...');
    	document.addEventListener('DOMContentLoaded', () => {
    		console.log('✅ DOM loaded, starting game');
    		new Game();
    	});
    } else {
    	console.log('✅ DOM already loaded, starting game immediately');
    	new Game();
    }

})();
