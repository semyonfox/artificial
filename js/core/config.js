export const config = {
  // Resource display icons organized by historical era (fixed invalid/duplicate icons)
  resourceIcons: {
    // Paleolithic Era
    sticks: "🪵",
    stones: "🪨",
    meat: "🥩",
    cookedMeat: "🍖",
    bones: "🦴",
    fur: "🧥",
    // Neolithic Era
    grain: "🌾",
    clay: "🧱",
    pottery: "⚱️",
    livestock: "🐄",
    textiles: "🧶",
    tools: "🧰",
    // Bronze Age
    copper: "🔶",
    tin: "🔹",
    bronze: "🔨",
    wheel: "🛞",
    writing: "📜",
    trade: "💰",
    // Iron Age
    iron: "⛓️",
    steel: "🔩",
    coins: "🪙",
    roads: "🛣️",
    cities: "🏛️",
    knowledge: "📚",
    // Classical Era
    engineering: "🏗️",
    aqueducts: "💧",
    philosophy: "🤔",
    mathematics: "📐",
    medicine: "⚕️",
    art: "🎨",
    // Medieval Era
    agriculture: "🌱",
    mills: "🌬️",
    guilds: "👥",
    manuscripts: "📖",
    castles: "🏰",
    religion: "⛪",
    // Renaissance
    printing: "🖨️",
    exploration: "🧭",
    banking: "🏦",
    gunpowder: "💥",
    optics: "🔭",
    navigation: "⛵",
    ships: "🚢",
    wood: "🪵",
    // Industrial Age
    coal: "⛏️",
    steam: "💨",
    factories: "🏭",
    railways: "🚂",
    electricity: "⚡",
    oil: "🛢️",
    telegraph: "📡",
    // Information Age
    silicon: "🔌",
    chips: "🔧",
    computers: "💻",
    servers: "🖥️",
    data: "💾",
    internet: "🌐",
    satellites: "🛰️",
    software: "🧩",
    // Space Age
    rockets: "🚀",
    solarPanels: "☀️",
    robotics: "🤖",
    fusion: "⚛️",
    spaceStations: "🛸",
    terraforming: "🌍",
    probes: "📡",
    // Galactic Era
    antimatter: "⚛️",
    darkMatter: "🌌",
    wormholes: "🕳️",
    dysonSpheres: "☀️",
    quantumComputers: "🧠",
    megastructures: "🏗️",
    timeManipulation: "⏳",
    // Universal Era
    multiverseAccess: "🌀",
    realityEngines: "🧬",
    consciousnessTransfer: "👁️",
    universalConstants: "🎲",
    existentialEnergy: "✨",
    cosmicStrings: "🌠",
    // Special
    population: "👥",
    defense: "🛡️",
    research: "📚",
  },

  // Era definitions with historically-aligned periods
  eras: {
    paleolithic: {
      name: "Paleolithic Era",
      timespan: "2.6M - 10K BCE",
      description:
        "Old Stone Age: hunter-gatherers, stone tools, fire, clothing.",
    },
    neolithic: {
      name: "Neolithic Era",
      timespan: "10K - 3.3K BCE",
      description:
        "Agricultural Revolution: farming, pottery, weaving, permanent settlements.",
    },
    bronze: {
      name: "Bronze Age",
      timespan: "3300 - 1200 BCE",
      description:
        "Copper + tin alloying, writing, the wheel, early trade networks.",
    },
    iron: {
      name: "Iron Age",
      timespan: "1200 - 600 BCE",
      description: "Iron smelting, coinage, roads, fortified cities.",
    },
    classical: {
      name: "Classical Era",
      timespan: "600 BCE - 500 CE",
      description:
        "Greece and Rome: philosophy, math, medicine, large-scale engineering.",
    },
    medieval: {
      name: "Medieval Era",
      timespan: "500 - 1500 CE",
      description: "Feudalism, mills, guilds, manuscript culture, castles.",
    },
    renaissance: {
      name: "Renaissance",
      timespan: "1300 - 1600 CE",
      description: "Printing press, banking, navigation, optics, gunpowder.",
    },
    industrial: {
      name: "Industrial Age",
      timespan: "1760 - 1840",
      description:
        "Steam power, coal, factories, railways, electrification begins.",
    },
    information: {
      name: "Information Age",
      timespan: "1950 - 2020",
      description:
        "Silicon, microprocessors, internet, software and satellites.",
    },
    space: {
      name: "Space Age",
      timespan: "1957 - 2100",
      description:
        "Rockets, solar power, robotics, fusion research, orbital stations.",
    },
    galactic: {
      name: "Galactic Era",
      timespan: "2100+",
      description:
        "Interstellar industry: Dyson swarms, FTL concepts, quantum computing.",
    },
    universal: {
      name: "Universal Era",
      timespan: "Far Future",
      description:
        "Reality manipulation, multiverse access, consciousness transfer.",
    },
  },

  // Historical events and disasters by era (trimmed and corrected placement)
  events: {
    paleolithic: [
      {
        type: "disaster",
        name: "Ice Age",
        description: "Harsh winters reduce food availability",
        effect: { meat: -0.5, fur: 0.2 },
      },
      {
        type: "discovery",
        name: "Cave Paintings",
        description: "Early artistic expression discovered",
        effect: { population: 0.1 },
      },
      {
        type: "breakthrough",
        name: "Tool Making",
        description: "Better stone tool techniques developed",
        effect: { stones: 0.3 },
      },
    ],
    neolithic: [
      {
        type: "disaster",
        name: "Crop Failure",
        description: "Poor harvest threatens settlement",
        effect: { grain: -0.4, population: -0.1 },
      },
      {
        type: "discovery",
        name: "Animal Domestication",
        description: "Livestock provide steady resources",
        effect: { livestock: 0.5, meat: 0.2 },
      },
      {
        type: "breakthrough",
        name: "Pottery Wheel",
        description: "Mass production of clay vessels",
        effect: { pottery: 0.4 },
      },
      {
        type: "disaster",
        name: "Drought",
        description: "Extended dry period affects crops",
        effect: { grain: -0.3, livestock: -0.2 },
      },
      {
        type: "discovery",
        name: "Weaving Techniques",
        description: "Advanced textile production methods",
        effect: { textiles: 0.6 },
      },
    ],
    bronze: [
      {
        type: "disaster",
        name: "Bronze Age Collapse",
        description: "Mysterious societal collapse",
        effect: { trade: -0.6, cities: -0.3 },
      },
      {
        type: "discovery",
        name: "Written Language",
        description: "Complex writing systems developed",
        effect: { writing: 0.5, knowledge: 0.3 },
      },
      {
        type: "breakthrough",
        name: "The Wheel",
        description: "Revolutionary transportation technology",
        effect: { trade: 0.4, wheel: 1.0 },
      },
      {
        type: "disaster",
        name: "Trade Route Disruption",
        description: "Key trade connections severed",
        effect: { bronze: -0.4, trade: -0.5 },
      },
    ],
    iron: [
      {
        type: "disaster",
        name: "War and Conquest",
        description: "Military conflicts devastate regions",
        effect: { population: -0.3, cities: -0.2 },
      },
      {
        type: "breakthrough",
        name: "Smelting Advances",
        description: "Improved furnaces increase output",
        effect: { iron: 0.5, steel: 0.2 },
      },
      {
        type: "discovery",
        name: "Coinage Reform",
        description: "Standardized money boosts trade",
        effect: { trade: 0.4, coins: 0.4 },
      },
    ],
    classical: [
      {
        type: "disaster",
        name: "Plague Outbreak",
        description: "Disease spreads through cities",
        effect: { population: -0.4, cities: -0.1 },
      },
      {
        type: "discovery",
        name: "Philosophical Schools",
        description: "Systematic inquiry thrives",
        effect: { knowledge: 0.6, philosophy: 0.5 },
      },
      {
        type: "breakthrough",
        name: "Aqueducts",
        description: "Urban infrastructure expands",
        effect: { aqueducts: 0.8, cities: 0.3 },
      },
    ],
    medieval: [
      {
        type: "disaster",
        name: "Famine",
        description: "Food shortages due to poor harvests",
        effect: { agriculture: -0.4, population: -0.1 },
      },
      {
        type: "discovery",
        name: "Watermills Spread",
        description: "Mechanization of milling",
        effect: { mills: 0.7 },
      },
      {
        type: "breakthrough",
        name: "Guild Charters",
        description: "Organized crafts improve quality",
        effect: { guilds: 0.6, trade: 0.2 },
      },
    ],
    renaissance: [
      {
        type: "discovery",
        name: "Printing Boom",
        description: "Knowledge dissemination accelerates",
        effect: { printing: 0.8, knowledge: 0.3 },
      },
      {
        type: "breakthrough",
        name: "Ocean Navigation",
        description: "Long-range voyages possible",
        effect: { exploration: 0.6, trade: 0.4 },
      },
      {
        type: "disaster",
        name: "Religious Conflicts",
        description: "Wars disrupt production",
        effect: { population: -0.1, banking: -0.2 },
      },
    ],
    industrial: [
      {
        type: "disaster",
        name: "Factory Fire",
        description: "Industrial accident damages production",
        effect: { factories: -0.3, steam: -0.2 },
      },
      {
        type: "discovery",
        name: "Electric Power",
        description: "Harnessing electrical power",
        effect: { electricity: 0.6, factories: 0.3 },
      },
      {
        type: "breakthrough",
        name: "Steam Engine",
        description: "Steam power revolutionizes industry",
        effect: { steam: 0.8, railways: 0.4 },
      },
      {
        type: "disaster",
        name: "Economic Depression",
        description: "Financial crisis halts progress",
        effect: { factories: -0.4, railways: -0.3 },
      },
    ],
    information: [
      {
        type: "disaster",
        name: "System Crash",
        description: "Major systems fail",
        effect: { data: -0.4, computers: -0.2 },
      },
      {
        type: "discovery",
        name: "Internet",
        description: "Global information network",
        effect: { internet: 0.7, data: 0.5 },
      },
      {
        type: "breakthrough",
        name: "Microprocessor",
        description: "Computers become ubiquitous",
        effect: { silicon: 0.6, computers: 0.8 },
      },
      {
        type: "disaster",
        name: "Cyber Attack",
        description: "Malware damages networks",
        effect: { internet: -0.3, data: -0.5 },
      },
      {
        type: "discovery",
        name: "Artificial Intelligence",
        description: "ML breakthroughs",
        effect: { software: 1.0, data: 0.8 },
      },
    ],
    space: [
      {
        type: "disaster",
        name: "Launch Failure",
        description: "Rocket lost on ascent",
        effect: { rockets: -0.5 },
      },
      {
        type: "discovery",
        name: "Reusable Boosters",
        description: "Cheaper access to orbit",
        effect: { rockets: 0.8, satellites: 0.4 },
      },
      {
        type: "breakthrough",
        name: "In-Situ Resource Use",
        description: "Off-world resource utilization",
        effect: { spaceStations: 0.5, robotics: 0.4 },
      },
    ],
    galactic: [
      {
        type: "disaster",
        name: "Containment Breach",
        description: "Antimatter containment failure",
        effect: { antimatter: -0.6 },
      },
      {
        type: "breakthrough",
        name: "Dyson Segment Deployed",
        description: "Massive energy influx",
        effect: { dysonSpheres: 1.0, electricity: 0.5 },
      },
    ],
    universal: [
      {
        type: "discovery",
        name: "Cosmic String Mapping",
        description: "Energy channeling improves",
        effect: { cosmicStrings: 0.7, existentialEnergy: 0.4 },
      },
    ],
  },

  // Worker automation timers (ms) - kept for backward compat, actual intervals in eraData
  workerTimers: {
    gatherer: 4000,
    hunter: 6000,
    cook: 3000,
    craftsman: 10000,
    farmer: 8000,
    miner: 12000,
    scholar: 20000,
    engineer: 25000,
    potter: 6000,
    herder: 10000,
    metalworker: 12000,
    scribe: 15000,
    merchant: 10000,
    blacksmith: 10000,
    architect: 15000,
    philosopher: 18000,
    physician: 20000,
    miller: 10000,
    monk: 15000,
    guildMaster: 12000,
    printer: 8000,
    explorer: 15000,
    banker: 10000,
    factoryWorker: 8000,
    inventor: 12000,
    programmer: 6000,
    networkEngineer: 10000,
    astronaut: 15000,
    rocketEngineer: 12000,
    fusionScientist: 18000,
    dysonBuilder: 20000,
    quantumResearcher: 18000,
    antimatterEngineer: 15000,
    realityArchitect: 20000,
    multiverseNavigator: 15000,
    consciousnessEngineer: 18000,
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
    burnChance: 0.3,
    stoneChanceFromSticks: 0.35, // Increased from 0.2 to 0.35 (75% increase)
    furDropChance: 0.6,
    eventChance: 0.1, // 10% per minute
    disasterChance: 0.05, // 5% disasters
  },

  // Game balance variables
  gameVariables: {
    meatProduction: 1,
    foodProduction: 1,
    workerFoodConsumption: 1, // 1 food per 3 work cycles (tracked in WorkerManager)
    workerFoodCycleInterval: 3, // consume food every N work cycles
    researchSpeed: 1,
    populationGrowth: 1,
  },

  // UI configuration
  ui: {
    notificationDuration: 2000, // Reduced from 3000 to 2000
    progressAnimationSpeed: 200,
  },

  // Save/load settings
  storage: {
    saveKey: "evolutionClickerSave",
    autoSaveInterval: 30000,
  },

  // Worker bonuses and efficiency multipliers (kept small)
  workerBonuses: {
    gathering: 0.5,
    hunting: 0.8,
    cooking: 0.3,
    farming: 1.0,
    crafting: 0.7,
    scholarly: 1.2,
    engineering: 1.5,
  },

  // Resource efficiency multipliers by upgrade (keep tight)
  efficiencyMultipliers: {
    sticks: { stoneKnapping: 1.2, boneTools: 1.5, shelterBuilding: 1.3 },
    stones: { stoneKnapping: 1.5, boneTools: 1.8 },
    meat: { stoneKnapping: 2.0, boneTools: 2.5, furClothing: 1.3 },
    grain: { agriculture: 2.0, tools: 1.5, pottery: 1.2 },
    bronze: { bronzeWorking: 2.0, wheel: 1.3, mathematics: 1.2 },
  },

  // Game balance constants
  balance: {
    basePopulationGrowth: 0.05,
    populationGrowth: {
      baseRate: 0.05, // 0.05 pop/sec base (5x previous)
      eraScaling: 0.3, // rate = base * (1 + eraIndex * 0.3)
      clothingBonus: 1.5,
      shelterBonus: 2.0,
      aqueductBonus: 1.3, // Classical+ with aqueducts upgrade
      medicineBonus: 1.2, // Classical+ with medicine upgrade
    },
    maxPopulationPerEra: {
      paleolithic: 50,
      neolithic: 150,
      bronze: 500,
      iron: 2000,
      classical: 8000,
      medieval: 25000,
      renaissance: 100000,
      industrial: 300000,
      information: 1000000,
      space: 3000000,
      galactic: 10000000,
      universal: 50000000,
    },
    workerCostScaling: 1.15, // was 1.5, now much gentler
    workerDiminishingReturns: 0.05, // each duplicate worker -5% efficiency
    workerEfficiency: {
      wellFed: 1.0,
      hungry: 0.6, // was 0.5
      starving: 0.2, // was 0.1
    },
  },

  // Prestige talent tree
  prestigeTalentTree: [
    // Tier 1 - early game acceleration
    { id: 'quickStart', name: 'Quick Start', description: 'Start with 10 of each Paleolithic resource', cost: 5, tier: 1, unlockEra: null },
    { id: 'firstWorkers', name: 'First Workers', description: 'Start with 2 gatherers + 1 cook', cost: 10, tier: 1, unlockEra: null },
    { id: 'ancestralMemory', name: 'Ancestral Memory', description: 'Start at 25% of highest-era-reached population cap', cost: 10, tier: 1, unlockEra: null },
    // Tier 2 - growth multipliers
    { id: 'populationBoom', name: 'Population Boom', description: 'Population growth x3 in all eras', cost: 20, tier: 2, unlockEra: null },
    { id: 'fertileLands', name: 'Fertile Lands', description: 'Grain production x2 starting Neolithic', cost: 20, tier: 2, unlockEra: null },
    { id: 'workerEfficiency', name: 'Worker Efficiency', description: 'All workers -15% intervals', cost: 25, tier: 2, unlockEra: null },
    // Tier 3 - cost reductions (unlock at Bronze)
    { id: 'masterCrafter', name: 'Master Crafter', description: 'All worker hiring costs -25%', cost: 30, tier: 3, unlockEra: 'bronze' },
    { id: 'engineeringGenius', name: 'Engineering Genius', description: 'All upgrade costs -20%', cost: 35, tier: 3, unlockEra: 'bronze' },
    // Tier 4 - advanced unlocks (unlock at Renaissance)
    { id: 'culturalMemory', name: 'Cultural Memory', description: 'Auto-unlock first upgrade tier of each completed era', cost: 40, tier: 4, unlockEra: 'renaissance' },
    { id: 'timeDilation', name: 'Time Dilation', description: 'All worker intervals -30% (stacks with era tech)', cost: 50, tier: 4, unlockEra: 'renaissance' },
    // Era skips - unlock when reaching that era
    { id: 'eraSkipBronze', name: 'Era Skip: Bronze', description: 'Start at Bronze Age', cost: 75, tier: 4, unlockEra: 'bronze' },
    { id: 'eraSkipIron', name: 'Era Skip: Iron', description: 'Start at Iron Age', cost: 75, tier: 4, unlockEra: 'iron' },
    { id: 'eraSkipClassical', name: 'Era Skip: Classical', description: 'Start at Classical Era', cost: 75, tier: 4, unlockEra: 'classical' },
    { id: 'eraSkipMedieval', name: 'Era Skip: Medieval', description: 'Start at Medieval Era', cost: 75, tier: 4, unlockEra: 'medieval' },
    { id: 'eraSkipRenaissance', name: 'Era Skip: Renaissance', description: 'Start at Renaissance', cost: 75, tier: 4, unlockEra: 'renaissance' },
    { id: 'eraSkipIndustrial', name: 'Era Skip: Industrial', description: 'Start at Industrial Age', cost: 75, tier: 4, unlockEra: 'industrial' },
    { id: 'eraSkipInformation', name: 'Era Skip: Information', description: 'Start at Information Age', cost: 75, tier: 4, unlockEra: 'information' },
    { id: 'eraSkipSpace', name: 'Era Skip: Space', description: 'Start at Space Age', cost: 75, tier: 4, unlockEra: 'space' },
    { id: 'eraSkipGalactic', name: 'Era Skip: Galactic', description: 'Start at Galactic Era', cost: 75, tier: 4, unlockEra: 'galactic' },
    // Tier 5 - soft completion
    { id: 'universalDestiny', name: 'Universal Destiny', description: 'Unlock Information era as starting point after reaching Universal', cost: 200, tier: 5, unlockEra: 'universal' },
  ],

  // Era specializations (mutually exclusive upgrades from Bronze onward)
  eraSpecializations: {
    bronze: [
      { id: 'tradeEmpire', name: 'Trade Empire', description: 'Merchants x2, sailing routes x1.5. Metalworkers -25%', bonuses: { merchant: 2.0, trade: 1.5 }, penalties: { metalworker: 0.75 } },
      { id: 'weaponsMaster', name: 'Weapons Master', description: 'Bronze weapons give x1.5 combat production. Trade routes -50%', bonuses: { bronze: 1.5, steel: 1.5 }, penalties: { trade: 0.5 } },
      { id: 'scholarsPath', name: "Scholar's Path", description: 'Writing x2, knowledge x1.3. Bronze production -25%', bonuses: { writing: 2.0, knowledge: 1.3 }, penalties: { bronze: 0.75 } },
    ],
    renaissance: [
      { id: 'scientificRevolution', name: 'Scientific Revolution', description: 'Knowledge x2, all science x1.5. Printing -25%', bonuses: { knowledge: 2.0, philosophy: 1.5, mathematics: 1.5 }, penalties: { printing: 0.75 } },
      { id: 'explorationAge', name: 'Exploration Age', description: 'Explorers x1.5, navigation x2. Banking -25%', bonuses: { exploration: 1.5, navigation: 2.0 }, penalties: { banking: 0.75 } },
      { id: 'bankingDynasty', name: 'Banking Dynasty', description: 'Coins x2, trade value x1.5. Knowledge -25%', bonuses: { coins: 2.0, trade: 1.5 }, penalties: { knowledge: 0.75 } },
    ],
    industrial: [
      { id: 'mechanization', name: 'Mechanization', description: 'Factory output x2, railways x1.5. Coal consumption x1.3', bonuses: { factories: 2.0, railways: 1.5 }, penalties: { coal: 0.77 } },
      { id: 'electricalRevolution', name: 'Electrical Revolution', description: 'Electricity x3, all machines x1.2. Coal -25%', bonuses: { electricity: 3.0, factories: 1.2 }, penalties: { coal: 0.75 } },
      { id: 'roboticAge', name: 'Robotic Age', description: 'Automation x2, worker intervals -20%. Pop cap -30%', bonuses: { robotics: 2.0 }, penalties: {}, special: 'roboticAge' },
    ],
    information: [
      { id: 'internetFirst', name: 'Internet First', description: 'Internet x2, data x1.5. Computer cost x1.3', bonuses: { internet: 2.0, data: 1.5 }, penalties: { computers: 0.77 } },
      { id: 'aiSoftware', name: 'AI/Software', description: 'Software x2, automation x1.5. Silicon -25%', bonuses: { software: 2.0, data: 1.5 }, penalties: { silicon: 0.75 } },
      { id: 'quantumFocus', name: 'Quantum Computing', description: 'Quantum research x3. Standard computers -30%', bonuses: { quantumComputers: 3.0 }, penalties: { computers: 0.7 } },
    ],
  },

  // Complete era definitions with workers, upgrades, and progression requirements
  eraData: {
    paleolithic: {
      id: "paleolithic",
      name: "Paleolithic Era",
      timespan: "2.6M - 10K BCE",
      description:
        "The Old Stone Age - humanity's longest period of hunter-gatherer societies and stone tool use.",
      advancementCost: { population: 8, sticks: 15, stones: 10, cookedMeat: 8, fur: 3 },
      workers: [
        {
          id: "gatherer",
          name: "Gatherer",
          description:
            "Collects sticks, stones, and plant materials. The foundation of Paleolithic survival.",
          cost: { sticks: 3 }, // Reduced from 5 to ease early grind
          produces: { sticks: 1, stones: 0.3 },
          interval: 4000,
        },
        {
          id: "hunter",
          name: "Hunter",
          description:
            "Hunts animals for meat, bones, and fur using stone tools. Requires stone knapping knowledge.",
          cost: { stones: 5, bones: 1 }, // Reduced from 8/2/2 to ease early grind
          produces: { meat: 1, bones: 0.4, fur: 0.3 },
          interval: 6000,
          requiresUpgrade: "stoneKnapping",
        },
        {
          id: "cook",
          name: "Cook",
          description:
            "Cooks meat over fire, making it safer and more nutritious. Essential for population growth.",
          cost: { sticks: 5, stones: 1 }, // Reduced from 10/2/1 and removed cookedMeat requirement
          produces: { cookedMeat: 1 },
          consumes: { meat: 1 },
          interval: 3000,
          requiresUpgrade: "fireControl",
        },
      ],
      upgrades: [
        {
          id: "stoneKnapping",
          name: "Stone Knapping",
          description:
            "Master the art of shaping stone into sharp tools and weapons",
          cost: { stones: 10, sticks: 10 },
          effect: "Unlocks hunting and improves tool efficiency",
          priority: 1,
          historical:
            "Stone knapping was humanity's first technology, dating back 2.6 million years.",
        },
        {
          id: "fireControl",
          name: "Fire Control",
          description:
            "Learn to make and maintain fire - a revolutionary survival technology",
          cost: { sticks: 15, stones: 5 },
          effect:
            "Unlocks cooking, provides warmth, and enables advanced crafting",
          priority: 2,
          historical:
            "Controlled use of fire began around 790,000 years ago, transforming human evolution.",
        },
        {
          id: "boneTools",
          name: "Bone Tools",
          description:
            "Craft specialized tools from animal bones for better efficiency",
          cost: { bones: 8, stones: 6 },
          effect: "Improves all resource gathering efficiency by 50%",
          priority: 3,
          historical:
            "Bone tools appeared around 90,000 years ago, showing advanced craftsmanship.",
          requiresUpgrade: "fireControl",
        },
        {
          id: "clothing",
          name: "Fur Clothing",
          description:
            "Create warm clothing from animal furs for survival in harsh climates",
          cost: { fur: 5, bones: 3 },
          effect: "Increases population growth rate by 50%",
          priority: 4,
          historical:
            "Clothing likely developed 170,000 years ago, enabling migration to colder regions.",
          requiresUpgrade: "stoneKnapping",
        },
        {
          id: "shelterBuilding",
          name: "Shelter Construction",
          description: "Build permanent shelters using sticks, stones, and fur",
          cost: { sticks: 30, stones: 20, fur: 8, bones: 6 },
          effect: "Doubles population growth rate and reduces disaster damage",
          priority: 5,
          historical:
            "The oldest known structures date to 400,000 years ago in Terra Amata, France.",
        },
      ],
    },

    neolithic: {
      id: "neolithic",
      name: "Neolithic Era",
      timespan: "10K - 3.3K BCE",
      description:
        "The New Stone Age - the Agricultural Revolution begins with farming and permanent settlements.",
      advancementCost: { population: 40, grain: 40, pottery: 15, textiles: 10, tools: 10 },
      workers: [
        {
          id: "farmer",
          name: "Farmer",
          description:
            "Cultivates grain crops, revolutionizing food production and enabling larger populations.",
          cost: { grain: 15, tools: 5, pottery: 3 },
          produces: { grain: 3, population: 0.1 },
          interval: 8000,
        },
        {
          id: "potter",
          name: "Potter",
          description:
            "Creates clay vessels for storage and cooking, essential for agricultural society.",
          cost: { clay: 10, grain: 10 },
          produces: { pottery: 2, clay: 1, tools: 0.3 },
          interval: 6000,
          requiresUpgrade: "pottery",
        },
        {
          id: "herder",
          name: "Herder",
          description:
            "Domesticates and raises livestock for meat, milk, and textiles.",
          cost: { grain: 25, pottery: 8, livestock: 2 },
          produces: { livestock: 1, meat: 1.5, textiles: 0.5 },
          interval: 10000,
          requiresUpgrade: "animalDomestication",
        },
      ],
      upgrades: [
        {
          id: "agriculture",
          name: "Agriculture",
          description: "Develop systematic farming techniques to grow crops",
          cost: { grain: 30, tools: 10 },
          effect: "Unlocks farming and greatly increases food production",
          priority: 1,
          historical:
            "Agriculture developed independently around 10,000 BCE in the Fertile Crescent.",
        },
        {
          id: "pottery",
          name: "Pottery Making",
          description: "Master the art of shaping and firing clay vessels",
          cost: { clay: 20, tools: 8 },
          effect: "Unlocks pottery production and food storage",
          priority: 2,
          historical:
            "Pottery appeared around 18,000 BCE, enabling food storage and cooking.",
        },
        {
          id: "animalDomestication",
          name: "Animal Domestication",
          description: "Tame wild animals for food, labor, and materials",
          cost: { grain: 30, livestock: 5, pottery: 10 },
          effect: "Unlocks livestock production and increases meat yield",
          priority: 3,
          historical:
            "Dogs were first domesticated 15,000 years ago, followed by sheep and goats.",
        },
        {
          id: "weaving",
          name: "Textile Weaving",
          description: "Create cloth from plant and animal fibers",
          cost: { textiles: 8, tools: 10, livestock: 3 },
          effect: "Improves clothing and trade opportunities",
          priority: 4,
          historical:
            "Textile production began around 7000 BCE with linen in Egypt.",
        },
      ],
    },

    bronze: {
      id: "bronze",
      name: "Bronze Age",
      timespan: "3300 - 1200 BCE",
      description:
        "First metal working civilizations emerge with bronze tools revolutionizing society.",
      advancementCost: { population: 150, bronze: 50, writing: 15, trade: 30 },
      workers: [
        {
          id: "metalworker",
          name: "Metalworker",
          description:
            "Smelts copper and tin to create bronze tools and weapons.",
          cost: { copper: 30, tin: 10, tools: 5 },
          produces: { bronze: 2, tools: 1 },
          interval: 12000,
          requiresUpgrade: "alloying",
        },
        {
          id: "scribe",
          name: "Scribe",
          description:
            "Records information using early writing systems for administration.",
          cost: { writing: 15, bronze: 8, trade: 5 },
          produces: { writing: 2, knowledge: 0.5 },
          interval: 15000,
          requiresUpgrade: "writingSystems",
        },
        {
          id: "merchant",
          name: "Merchant",
          description:
            "Facilitates trade between communities using wheels and roads.",
          cost: { bronze: 20, wheel: 5, trade: 10 },
          produces: { trade: 3, bronze: 0.5, wheel: 0.2 },
          interval: 10000,
          requiresUpgrade: "theWheel",
        },
      ],
      upgrades: [
        {
          id: "copperMining",
          name: "Copper Mining",
          description: "Extract copper ore from the earth",
          cost: { tools: 8 },
          effect: "Enables copper production",
          priority: 1,
          historical: "Copper mining began around 5000 BCE.",
        },
        {
          id: "tinMining",
          name: "Tin Mining",
          description: "Discover and mine tin deposits",
          cost: { tools: 6 },
          effect: "Enables tin production",
          priority: 2,
          historical: "Tin mining enabled the Bronze Age.",
        },
        {
          id: "alloying",
          name: "Bronze Alloying",
          description: "Combine copper and tin to create bronze",
          cost: { copper: 10, tin: 5 },
          effect: "Unlocks bronze production and metalworkers",
          priority: 3,
          historical: "Bronze working began around 3500 BCE.",
        },
        {
          id: "theWheel",
          name: "The Wheel",
          description: "Revolutionary invention for transportation",
          cost: { stones: 10 },
          effect: "Unlocks merchants and improves trade",
          priority: 4,
          historical: "The wheel was invented around 3500 BCE in Mesopotamia.",
        },
        {
          id: "writingSystems",
          name: "Writing Systems",
          description: "Develop symbols to record language",
          cost: { pottery: 8 },
          effect: "Unlocks scribes and knowledge accumulation",
          priority: 5,
          historical: "Cuneiform writing emerged around 3400 BCE.",
        },
      ],
    },

    iron: {
      id: "iron",
      name: "Iron Age",
      timespan: "1200 - 600 BCE",
      description:
        "Iron working spreads, creating stronger tools and weapons, leading to great empires.",
      advancementCost: { population: 500, iron: 30, coal: 20, steel: 50, coins: 25, roads: 20, knowledge: 15 },
      workers: [
        {
          id: "miner",
          name: "Miner",
          description: "Extracts iron ore and coal from the earth.",
          cost: { iron: 15, stones: 8 },
          produces: { iron: 2, coal: 1 },
          interval: 12000,
          requiresUpgrade: "ironSmelting",
        },
        {
          id: "blacksmith",
          name: "Blacksmith",
          description: "Smelts iron with coal to forge steel.",
          cost: { iron: 30, coal: 10 },
          produces: { steel: 2, tools: 1 },
          consumes: { iron: 1, coal: 1 },
          interval: 10000,
          requiresUpgrade: "bloomery",
        },
        {
          id: "engineer",
          name: "Engineer",
          description: "Designs infrastructure for growing civilizations.",
          cost: { steel: 20, knowledge: 15 },
          produces: { roads: 1, cities: 0.3 },
          interval: 15000,
          requiresUpgrade: "roadBuilding",
        },
        {
          id: "scholar",
          name: "Scholar",
          description: "Studies and accumulates knowledge through research.",
          cost: { knowledge: 20, coins: 10 },
          produces: { knowledge: 3, coins: 0.5 },
          interval: 20000,
        },
      ],
      upgrades: [
        {
          id: "ironSmelting",
          name: "Iron Smelting",
          description: "Master the smelting of iron ore",
          cost: { bronze: 10, stones: 6 },
          effect: "Unlocks iron production and blacksmiths",
          priority: 1,
          historical: "Iron working began around 1500 BCE in Anatolia.",
        },
        {
          id: "bloomery",
          name: "Bloomery Furnaces",
          description: "Advanced furnaces for iron production",
          cost: { iron: 10 },
          effect: "Improves iron and steel production",
          priority: 2,
          historical:
            "Bloomery furnaces were the first iron-smelting technology.",
        },
        {
          id: "coinage",
          name: "Coinage",
          description: "Standardize currency for efficient trade",
          cost: { bronze: 12 },
          effect: "Revolutionizes commerce",
          priority: 3,
          historical: "First coins appeared in Lydia around 650 BCE.",
        },
        {
          id: "roadBuilding",
          name: "Road Building",
          description: "Construct roads for trade and military",
          cost: { stones: 20 },
          effect: "Unlocks engineers and improves trade",
          priority: 4,
          historical: "Roman roads connected vast empires.",
        },
      ],
    },

    classical: {
      id: "classical",
      name: "Classical Era",
      timespan: "600 BCE - 500 CE",
      description:
        "Greece and Rome bring philosophy, mathematics, medicine, and large-scale engineering.",
      advancementCost: { population: 1500, engineering: 50, aqueducts: 30, knowledge: 40, medicine: 20, philosophy: 15 },
      workers: [
        {
          id: "architect",
          name: "Architect",
          description: "Designs aqueducts, roads, and public buildings.",
          cost: { cities: 15, knowledge: 10, iron: 20 },
          produces: { engineering: 2, aqueducts: 0.5 },
          interval: 15000,
          requiresUpgrade: "civilEngineering",
        },
        {
          id: "philosopher",
          name: "Philosopher",
          description: "Advances knowledge through systematic inquiry.",
          cost: { knowledge: 20, cities: 5 },
          produces: { philosophy: 2, mathematics: 1, knowledge: 1 },
          interval: 18000,
          requiresUpgrade: "philosophySchools",
        },
        {
          id: "physician",
          name: "Physician",
          description:
            "Studies and treats disease, improving population health.",
          cost: { knowledge: 15, medicine: 5 },
          produces: { medicine: 2, population: 0.05 },
          interval: 20000,
          requiresUpgrade: "classicalMedicine",
        },
      ],
      upgrades: [
        {
          id: "civilEngineering",
          name: "Civil Engineering",
          description: "Plan and build large-scale infrastructure",
          cost: { iron: 12, coins: 10 },
          effect: "Unlocks architects and aqueduct construction",
          priority: 1,
          historical:
            "Roman engineering produced roads, aqueducts, and the Colosseum.",
        },
        {
          id: "philosophySchools",
          name: "Philosophy Schools",
          description: "Establish centers of learning and debate",
          cost: { writing: 10, knowledge: 15 },
          effect: "Unlocks philosophers and accelerates knowledge",
          priority: 2,
          historical:
            "Plato's Academy (387 BCE) was the first institution of higher learning.",
        },
        {
          id: "classicalMedicine",
          name: "Medicine",
          description: "Systematic study of health and disease",
          cost: { knowledge: 20, philosophy: 10 },
          effect: "Unlocks physicians and boosts population growth",
          priority: 3,
          historical:
            "Hippocrates (460 BCE) is considered the father of medicine.",
        },
        {
          id: "classicalMathematics",
          name: "Mathematics",
          description: "Develop geometry, algebra, and number theory",
          cost: { writing: 12, philosophy: 8 },
          effect: "Improves engineering and knowledge production",
          priority: 4,
          historical:
            "Euclid's Elements (300 BCE) shaped mathematics for two millennia.",
        },
      ],
    },

    medieval: {
      id: "medieval",
      name: "Medieval Era",
      timespan: "500 - 1500 CE",
      description:
        "Feudalism, mills, guilds, manuscript culture, and castles define a millennium.",
      advancementCost: { population: 5000, agriculture: 60, manuscripts: 40, guilds: 30, religion: 20 },
      workers: [
        {
          id: "miller",
          name: "Miller",
          description: "Operates water and wind mills to process grain.",
          cost: { agriculture: 20, mills: 5 },
          produces: { mills: 1, agriculture: 2 },
          interval: 10000,
          requiresUpgrade: "watermills",
        },
        {
          id: "monk",
          name: "Monk",
          description: "Copies manuscripts and preserves knowledge.",
          cost: { manuscripts: 10, religion: 5 },
          produces: { manuscripts: 2, knowledge: 1, religion: 0.5 },
          interval: 15000,
          requiresUpgrade: "scriptoria",
        },
        {
          id: "guildMaster",
          name: "Guild Master",
          description: "Organizes crafts and improves trade quality.",
          cost: { guilds: 10, coins: 15 },
          produces: { guilds: 1, trade: 2 },
          interval: 12000,
          requiresUpgrade: "guildSystem",
        },
      ],
      upgrades: [
        {
          id: "heavyPlow",
          name: "Heavy Plow",
          description: "Iron-tipped plows for dense soils",
          cost: { iron: 8, agriculture: 15 },
          effect: "Greatly improves agricultural output",
          priority: 1,
          historical:
            "The heavy plow (6th century) transformed Northern European farming.",
        },
        {
          id: "watermills",
          name: "Water & Wind Mills",
          description: "Harness natural forces for mechanical power",
          cost: { stones: 15, iron: 10 },
          effect: "Unlocks millers and mechanized production",
          priority: 2,
          historical:
            "By 1086, England had over 6,000 water mills recorded in Domesday Book.",
        },
        {
          id: "guildSystem",
          name: "Guild System",
          description: "Organize craftsmen into professional associations",
          cost: { coins: 12, trade: 8 },
          effect: "Unlocks guild masters and improves trade",
          priority: 3,
          historical:
            "Merchant guilds emerged in the 11th century across Europe.",
        },
        {
          id: "scriptoria",
          name: "Scriptoria",
          description: "Establish manuscript copying workshops",
          cost: { manuscripts: 8, knowledge: 10 },
          effect: "Unlocks monks and preserves knowledge",
          priority: 4,
          historical:
            "Monastic scriptoria preserved classical texts through the Dark Ages.",
        },
      ],
    },

    renaissance: {
      id: "renaissance",
      name: "Renaissance",
      timespan: "1300 - 1600 CE",
      description:
        "A rebirth of learning brings printing, banking, navigation, and scientific inquiry.",
      advancementCost: { population: 15000, printing: 80, banking: 50, exploration: 40, navigation: 25, trade: 30 },
      workers: [
        {
          id: "printer",
          name: "Printer",
          description: "Operates the printing press to mass-produce books.",
          cost: { printing: 20, manuscripts: 10 },
          produces: { printing: 3, knowledge: 1 },
          interval: 8000,
          requiresUpgrade: "printingPress",
        },
        {
          id: "explorer",
          name: "Explorer",
          description: "Charts new trade routes and discovers new lands.",
          cost: { navigation: 15, banking: 10 },
          produces: { exploration: 2, trade: 2, navigation: 0.5 },
          interval: 15000,
          requiresUpgrade: "renaissanceNavigation",
        },
        {
          id: "banker",
          name: "Banker",
          description: "Manages finances and funds expeditions.",
          cost: { coins: 20, banking: 5 },
          produces: { banking: 2, coins: 1, trade: 1 },
          interval: 10000,
          requiresUpgrade: "renaissanceBanking",
        },
      ],
      upgrades: [
        {
          id: "printingPress",
          name: "Printing Press",
          description: "Mechanize book production",
          cost: { manuscripts: 12, iron: 8 },
          effect: "Unlocks printers and accelerates knowledge spread",
          priority: 1,
          historical:
            "Gutenberg's press (1440) revolutionized information distribution.",
        },
        {
          id: "renaissanceNavigation",
          name: "Navigation",
          description: "Develop tools and techniques for ocean voyages",
          cost: { optics: 10, printing: 8 },
          effect: "Unlocks explorers and new trade routes",
          priority: 2,
          historical:
            "The Age of Discovery (15th century) connected the world's continents.",
        },
        {
          id: "renaissanceBanking",
          name: "Banking",
          description:
            "Create financial institutions for lending and investment",
          cost: { coins: 20, trade: 10 },
          effect: "Unlocks bankers and trade expansion",
          priority: 3,
          historical: "The Medici Bank (1397) pioneered modern banking.",
        },
        {
          id: "scientificMethod",
          name: "Scientific Method",
          description: "Systematic observation and experimentation",
          cost: { printing: 15, knowledge: 20 },
          effect: "Improves all knowledge production",
          priority: 4,
          historical:
            "Galileo and Bacon formalized the scientific method in the 1600s.",
        },
      ],
    },

    industrial: {
      id: "industrial",
      name: "Industrial Age",
      timespan: "1760 - 1840",
      description:
        "The Industrial Revolution transforms society with steam power and mass production.",
      advancementCost: { population: 50000, factories: 150, electricity: 60, steam: 80 },
      workers: [
        {
          id: "factoryWorker",
          name: "Factory Worker",
          description: "Operates steam-powered machinery.",
          cost: { coal: 50, steam: 20 },
          produces: { factories: 1, steam: 1 },
          interval: 8000,
          requiresUpgrade: "steamEngine",
        },
        {
          id: "inventor",
          name: "Inventor",
          description: "Develops new technologies.",
          cost: { electricity: 40, factories: 15 },
          produces: { electricity: 3, steam: 1 },
          interval: 12000,
          requiresUpgrade: "electrification",
        },
      ],
      upgrades: [
        {
          id: "steamEngine",
          name: "Steam Engine",
          description: "Harness steam power for industry",
          cost: { coal: 20, iron: 12 },
          effect: "Unlocks factory workers",
          priority: 1,
          historical:
            "James Watt's improved steam engine (1769) powered the Industrial Revolution.",
        },
        {
          id: "electrification",
          name: "Electrification",
          description: "Generate and distribute electrical energy",
          cost: { coal: 10, copper: 8 },
          effect: "Unlocks inventors and advanced machinery",
          priority: 2,
          historical: "Edison's power station (1882) began the electrical age.",
        },
        {
          id: "bessemer",
          name: "Bessemer Steel",
          description: "Mass produce high-quality steel",
          cost: { coal: 10, iron: 20 },
          effect: "Greatly increases steel production",
          priority: 3,
          historical:
            "Bessemer process (1856) revolutionized steel manufacturing.",
        },
      ],
    },

    information: {
      id: "information",
      name: "Information Age",
      timespan: "1950 - 2020",
      description:
        "The Digital Revolution brings computers, internet, and global connectivity.",
      advancementCost: { population: 150000, computers: 200, data: 80, internet: 60, software: 40 },
      workers: [
        {
          id: "programmer",
          name: "Programmer",
          description: "Develops software and applications.",
          cost: { silicon: 100, computers: 20 },
          produces: { computers: 1, software: 3, data: 2 },
          interval: 6000,
          requiresUpgrade: "siliconProcessing",
        },
        {
          id: "networkEngineer",
          name: "Network Engineer",
          description: "Builds global communication networks.",
          cost: { computers: 50, internet: 15 },
          produces: { internet: 2, data: 1 },
          interval: 10000,
          requiresUpgrade: "networking",
        },
      ],
      upgrades: [
        {
          id: "siliconProcessing",
          name: "Silicon Processing",
          description: "Produce microchips from silicon",
          cost: { steel: 8, electricity: 15 },
          effect: "Enables computer production",
          priority: 1,
          historical: "Silicon Valley became the tech hub in the 1950s.",
        },
        {
          id: "microprocessor",
          name: "Microprocessor",
          description: "Create programmable computer chips",
          cost: { silicon: 20 },
          effect: "Unlocks programmers",
          priority: 2,
          historical: "Intel 4004 (1971) was the first microprocessor.",
        },
        {
          id: "networking",
          name: "Networking",
          description: "Connect computers globally",
          cost: { computers: 10 },
          effect: "Unlocks network engineers and internet",
          priority: 3,
          historical: "ARPANET (1969) evolved into the modern internet.",
        },
        {
          id: "softwareEngineering",
          name: "Software Engineering",
          description: "Systematic software development",
          cost: { data: 20 },
          effect: "Improves software production",
          priority: 4,
          historical:
            "Software engineering emerged as a discipline in the 1960s.",
        },
      ],
    },

    space: {
      id: "space",
      name: "Space Age",
      timespan: "1957 - 2100",
      description:
        "Humanity reaches beyond Earth with rockets, orbital stations, and fusion research.",
      advancementCost: { population: 500000, rockets: 400, spaceStations: 150, fusion: 80, robotics: 100 },
      workers: [
        {
          id: "astronaut",
          name: "Astronaut",
          description: "Crews orbital stations and conducts space research.",
          cost: { rockets: 50, spaceStations: 10 },
          produces: { spaceStations: 0.5, robotics: 1, fusion: 0.3 },
          interval: 15000,
          requiresUpgrade: "orbitalHab",
        },
        {
          id: "rocketEngineer",
          name: "Rocket Engineer",
          description: "Designs and builds launch vehicles.",
          cost: { computers: 30, steel: 50 },
          produces: { rockets: 2, satellites: 1 },
          interval: 12000,
          requiresUpgrade: "rocketry",
        },
        {
          id: "fusionScientist",
          name: "Fusion Scientist",
          description: "Researches controlled nuclear fusion.",
          cost: { computers: 40, electricity: 30 },
          produces: { fusion: 2, solarPanels: 1 },
          interval: 18000,
          requiresUpgrade: "fusionResearch",
        },
      ],
      upgrades: [
        {
          id: "rocketry",
          name: "Rocketry",
          description: "Develop reliable launch vehicles",
          cost: { steel: 20, computers: 10 },
          effect: "Unlocks rocket engineers",
          priority: 1,
          historical: "Sputnik (1957) launched the space age.",
        },
        {
          id: "orbitalHab",
          name: "Orbital Habitation",
          description: "Build permanent stations in orbit",
          cost: { rockets: 10, satellites: 10 },
          effect: "Unlocks astronauts and space stations",
          priority: 2,
          historical:
            "Skylab (1973) and ISS (1998) proved humans can live in space.",
        },
        {
          id: "fusionResearch",
          name: "Fusion Research",
          description: "Pursue clean, unlimited energy",
          cost: { computers: 20, electricity: 20 },
          effect: "Unlocks fusion scientists",
          priority: 3,
          historical: "ITER aims to demonstrate fusion power by the 2030s.",
        },
        {
          id: "spaceRobotics",
          name: "Space Robotics",
          description: "Automate space construction and mining",
          cost: { robotics: 10, satellites: 5 },
          effect: "Improves all space production",
          priority: 4,
          historical:
            "Robotic arms on ISS and Mars rovers advanced automation.",
        },
      ],
    },

    galactic: {
      id: "galactic",
      name: "Galactic Era",
      timespan: "2100+",
      description:
        "Interstellar civilization with Dyson swarms, quantum computing, and antimatter power.",
      advancementCost: { population: 2000000, antimatter: 500, darkMatter: 300, dysonSpheres: 20, quantumComputers: 30, wormholes: 15 },
      workers: [
        {
          id: "dysonBuilder",
          name: "Dyson Builder",
          description: "Constructs segments of stellar energy collectors.",
          cost: { robotics: 30, solarPanels: 50 },
          produces: { dysonSpheres: 0.5, electricity: 5 },
          interval: 20000,
          requiresUpgrade: "dysonSwarm",
        },
        {
          id: "quantumResearcher",
          name: "Quantum Researcher",
          description: "Pushes the boundaries of computation and physics.",
          cost: { computers: 50, satellites: 20 },
          produces: { quantumComputers: 1, darkMatter: 0.5 },
          interval: 18000,
          requiresUpgrade: "quantumComputing",
        },
        {
          id: "antimatterEngineer",
          name: "Antimatter Engineer",
          description: "Produces and contains antimatter for energy.",
          cost: { fusion: 30, quantumComputers: 10 },
          produces: { antimatter: 1, wormholes: 0.2 },
          interval: 15000,
          requiresUpgrade: "antimatterContainment",
        },
      ],
      upgrades: [
        {
          id: "dysonSwarm",
          name: "Dyson Swarm",
          description: "Surround a star with energy collectors",
          cost: { robotics: 20, solarPanels: 30 },
          effect: "Unlocks Dyson builders and massive energy",
          priority: 1,
          historical: "Freeman Dyson proposed stellar megastructures in 1960.",
        },
        {
          id: "quantumComputing",
          name: "Quantum Computing",
          description: "Harness quantum mechanics for computation",
          cost: { computers: 30, satellites: 20 },
          effect: "Unlocks quantum researchers",
          priority: 2,
          historical: "Quantum supremacy was first demonstrated in 2019.",
        },
        {
          id: "wormholeTheory",
          name: "Wormhole Theory",
          description: "Understand spacetime shortcuts",
          cost: { quantumComputers: 10, darkMatter: 5 },
          effect: "Enables interstellar travel research",
          priority: 3,
          historical: "Einstein-Rosen bridges were theorized in 1935.",
        },
        {
          id: "antimatterContainment",
          name: "Antimatter Containment",
          description: "Safely store and use antimatter",
          cost: { fusion: 20, quantumComputers: 5 },
          effect: "Unlocks antimatter engineers",
          priority: 4,
          historical: "CERN trapped antihydrogen atoms in 2010.",
        },
      ],
    },

    universal: {
      id: "universal",
      name: "Universal Era",
      timespan: "Far Future",
      description:
        "Reality manipulation, multiverse access, and consciousness transfer mark the ultimate era.",
      advancementCost: null,
      workers: [
        {
          id: "realityArchitect",
          name: "Reality Architect",
          description: "Reshapes the fabric of spacetime itself.",
          cost: { quantumComputers: 40, antimatter: 30 },
          produces: { realityEngines: 1, universalConstants: 0.5 },
          interval: 20000,
          requiresUpgrade: "realityEngineering",
        },
        {
          id: "multiverseNavigator",
          name: "Multiverse Navigator",
          description:
            "Traverses parallel realities for resources and knowledge.",
          cost: { wormholes: 20, realityEngines: 5 },
          produces: {
            multiverseAccess: 1,
            existentialEnergy: 1,
            cosmicStrings: 0.3,
          },
          interval: 15000,
          requiresUpgrade: "multiversalPhysics",
        },
        {
          id: "consciousnessEngineer",
          name: "Consciousness Engineer",
          description:
            "Transfers and expands consciousness beyond biological limits.",
          cost: { quantumComputers: 30, existentialEnergy: 10 },
          produces: { consciousnessTransfer: 1, population: 0.1 },
          interval: 18000,
          requiresUpgrade: "consciousnessUpload",
        },
      ],
      upgrades: [
        {
          id: "realityEngineering",
          name: "Reality Engineering",
          description: "Manipulate fundamental forces",
          cost: { quantumComputers: 20, antimatter: 20 },
          effect: "Unlocks reality architects",
          priority: 1,
          historical: "Theoretical endpoint of technological civilization.",
        },
        {
          id: "multiversalPhysics",
          name: "Multiversal Physics",
          description: "Access parallel universes",
          cost: { wormholes: 15, realityEngines: 5 },
          effect: "Unlocks multiverse navigators",
          priority: 2,
          historical:
            "The many-worlds interpretation was proposed by Everett in 1957.",
        },
        {
          id: "consciousnessUpload",
          name: "Consciousness Transfer",
          description: "Upload minds to digital substrates",
          cost: { quantumComputers: 12, consciousnessTransfer: 5 },
          effect: "Unlocks consciousness engineers",
          priority: 3,
          historical:
            "Mind uploading remains one of the grand challenges of neuroscience.",
        },
      ],
    },
  },
};
