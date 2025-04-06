// config.js
export const config = {
  resourceIcons: {
    // Basic Resources
    sticks: '🪵',
    stones: '🪨',
    rawMeat: '🥩',
    cookedMeat: '🍗',
    hide: '🟫',
    bones: '🦴',
    clothes: '🧥',
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
  workerTimers: {
    forager: 10000,
    hunter: 15000,
    cook: 8000,
  },
  workerBonuses: {
    workerBonusForager: 0,
    workerBonusHunter: 0,
    workerBonusCook: 0,
  },
  yields: {
    huntYield: 2,
  },
  probabilities: {
    burnChance: 0.35,
    stoneChanceFromSticks: 0.2,
  },
};
