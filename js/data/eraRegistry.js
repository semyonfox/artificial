export const eraRegistry = {
  paleolithic: {
    name: 'Paleolithic Era',
    path: './eras/paleolithic.js',
    order: 1,
    unlockConditions: {}, // Starting era
  },
  mesolithic: {
    name: 'Mesolithic Era',
    path: './eras/mesolithic.js',
    order: 2,
    unlockConditions: {
      requiredEra: 'paleolithic',
      requiredResources: { clothes: 5 },
    },
  },
  // TODO... other eras
};
