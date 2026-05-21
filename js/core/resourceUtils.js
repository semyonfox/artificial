import { config } from "./config.js";

export function scaleCost(baseCost = {}, multiplier = 1) {
  const cost = {};
  for (const [resource, amount] of Object.entries(baseCost)) {
    cost[resource] = Math.ceil(amount * multiplier);
  }
  return cost;
}

export function formatResourceList(
  resources = {},
  resourceFormatter = (resource) => resource,
  amountFormatter = (amount) => amount,
) {
  return Object.entries(resources)
    .map(([resource, amount]) => `${amountFormatter(amount)} ${resourceFormatter(resource)}`)
    .join(", ");
}

export function getEraIndex(eraKey) {
  return config.eraOrder.indexOf(eraKey);
}

export function isEraUnlocked(currentEra, requiredEra) {
  return getEraIndex(currentEra) >= getEraIndex(requiredEra);
}

export function hasAnyCivSpecialization(civSpecializations = {}, requiredCivs = []) {
  return Object.values(civSpecializations).some((civ) => requiredCivs.includes(civ));
}
