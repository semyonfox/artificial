export const paleolithicEra = {
  id: 'paleolithic',
  name: 'Paleolithic Era',
  dateRange: '2.5M BCE - 10,000 BCE',
  // Static resources (never modified directly)
  baseResources: ['sticks', 'stones', 'rawMeat', 'hide', 'bone', 'meat'],
  // Dynamic variables (tracked in gameState)
  variables: {
    burnChance: 0.35, // Base chance of burning meat when cooking
    workerBonuses: {
      sticks: 0,
      stones: 0,
      rawMeat: 0,
      hide: 0,
      bone: 0,
      meat: 0,
    },
    workerSpeed: {
      forager: 10000, // 10 seconds
      hunter: 10000, // 10 seconds
      cook: 10000, // 10 seconds
    },
  },
  // Workers (base stats)
  baseWorkerStats: {
    forager: {
      name: 'Forager',
      cost: { meat: 5 },
      baseProduction: { sticks: 1, stones: 0.3 },
      speed: 'forager',
    },
    hunter: {
      name: 'Hunter',
      cost: { meat: 5 },
      baseProduction: { rawMeat: 2, bone: 0.5, hide: 0.35 },
      speed: 'hunter',
    },
    cook: {
      name: 'Cook',
      cost: { meat: 5 },
      baseProduction: { cookedMeat: 1 },
      failureChance: 'burnChance', // References variables.burnChance
      speed: 'cook',
    },
  },
  // Upgrades (modify variables)
  upgrades: [
    {
      id: 'fireControl',
      name: 'Fire Control',
      cost: { sticks: 30, stones: 20 },
      effect: (gameState) => {
        gameState.eraData.paleolithic.variables.burnChance -= 0.5; // Reduce burn chance by 50%
      },
      maxCount: 1,
    },
    {
      id: 'boneTools',
      name: 'Bone Tools',
      cost: { bone: 15, sticks: 20 },
      effect: (gameState) => {
        const vars = gameState.eraData.paleolithic.variables;
        vars.workerBonuses.sticks += 1; // +1 stick per worker
        vars.workerBonuses.stones += 1; // +1 stone per worker
      },
      maxCount: 1,
    },
    {
      id: 'hunterClothes',
      name: 'Hunter Garb',
      description: 'Doubles hunting efficiency for 1 hunter',
      targetWorker: 'hunter',
      cost: { animalHide: 15, bones: 5 },
      effect: { efficiency: 2 },
    },
    {
      id: 'foragerClothes',
      name: 'Forager Attire',
      description: 'Doubles gathering efficiency for 1 forager',
      targetWorker: 'forager',
      cost: { animalHide: 10, sticks: 8 },
      effect: { efficiency: 2 },
    },
    {
      id: 'cookClothes',
      name: 'Cook Apron',
      description: 'Doubles cooking efficiency for 1 cook',
      targetWorker: 'cook',
      cost: { animalHide: 8, stones: 5 },
      effect: { efficiency: 2 },
      maxPerWorker: 1,
    },
  ],

  // Events (trigger conditions)
  events: [
    {
      id: 'wolfAttack',
      name: 'Wolf Attack!',
      trigger: {
        action: 'hunting',
        chance: 0.4, // 40% chance on each hunt
      },
      effect: (gameState) => {
        // Lose 1 hunter if available
        if (gameState.workers.hunter > 0) gameState.workers.hunter -= 1;
      },
    },
  ],
};
