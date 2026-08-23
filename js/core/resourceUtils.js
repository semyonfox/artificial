import { config } from "./config.js";

// per-era resources that feed population growth and worker upkeep. every era
// must keep at least one ongoing producer in its pool or automation starves.
export const POPULATION_SUPPORT_RESOURCES = {
  paleolithic: ["cookedMeat", "meat"],
  neolithic: ["grain", "livestock", "cookedMeat"],
  bronze: ["grain", "livestock", "trade"],
  iron: ["grain", "livestock", "cities", "trade"],
  classical: ["grain", "cities", "medicine"],
  medieval: ["agriculture", "grain", "mills"],
  renaissance: ["agriculture", "trade", "banking"],
  enlightenment: ["clockwork", "naturalHistory", "calculus"],
  industrial: ["factories", "steam", "electricity"],
  electric: ["electricity", "automobile", "chemicals"],
  atomic: ["electricity", "plastics", "television"],
  information: ["electricity", "data", "internet"],
  space: ["fusion", "spaceStations", "robotics"],
  galactic: ["robotics", "antimatter", "quantumComputers"],
  universal: ["realityEngines", "existentialEnergy", "universalConstants"],
};

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
    .map(
      ([resource, amount]) =>
        `${amountFormatter(amount)} ${resourceFormatter(resource)}`,
    )
    .join(", ");
}

export function getEraIndex(eraKey) {
  return config.eraOrder.indexOf(eraKey);
}

export function isEraUnlocked(currentEra, requiredEra) {
  return getEraIndex(currentEra) >= getEraIndex(requiredEra);
}

export function hasAnyCivSpecialization(
  civSpecializations = {},
  requiredCivs = [],
) {
  return Object.values(civSpecializations).some((civ) =>
    requiredCivs.includes(civ),
  );
}
