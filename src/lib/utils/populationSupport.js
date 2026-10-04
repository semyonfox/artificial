import { POPULATION_SUPPORT_RESOURCES } from '../../../js/core/resourceUtils.js';

export function getPopulationSupportResources(eraKey) {
  return POPULATION_SUPPORT_RESOURCES[eraKey] || ['grain', 'agriculture', 'cities'];
}
