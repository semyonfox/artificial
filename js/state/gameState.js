export let gameState = {
  currentEra: 'paleolithic',
  resources: {
    sticks: 0,
    stones: 0,
    rawMeat: 0,
    clothes: 0,
    bones: 0,
    meat: 0,
    hide: 0,
  },
  workers: {
    forager: 0,
    hunter: 0,
    cook: 0,
  },
  lastUpdate: Date.now(),
  equippedClothes: {
    // Format: { workerType: [array of worker IDs with clothes] }
    hunter: [],
    forager: [],
  },
  unlockedUpgrades: [],
};
