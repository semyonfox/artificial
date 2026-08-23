import { config } from "../../../js/core/config.js";
import { getEraIndex } from "../../../js/core/resourceUtils.js";

// display-only mirror of GameManager's module-private
// POPULATION_SUPPORT_RESOURCES table, so the UI can explain population growth
// without reaching into engine internals. never use for game logic.
const SUPPORT_RESOURCES = {
  paleolithic: ["cookedMeat", "meat"],
  neolithic: ["grain", "livestock", "cookedMeat"],
  bronze: ["grain", "livestock", "trade"],
  iron: ["grain", "livestock", "cities", "trade"],
  classical: ["grain", "cities", "medicine"],
  medieval: ["agriculture", "grain", "mills"],
  renaissance: ["agriculture", "trade", "banking"],
  enlightenment: ["agriculture", "academies", "reason"],
  industrial: ["factories", "steam", "electricity"],
  electric: ["electricity", "automobile", "chemicals"],
  atomic: ["electricity", "plastics", "television"],
  information: ["electricity", "data", "internet"],
  space: ["fusion", "spaceStations", "robotics"],
  galactic: ["dysonSpheres", "antimatter", "quantumComputers"],
  universal: ["realityEngines", "existentialEnergy", "universalConstants"],
};

export function getPopulationSupportResources(eraKey) {
  return SUPPORT_RESOURCES[eraKey] || ["grain", "agriculture", "cities"];
}

// mirrors WorkerManager's era food choice for consumption estimates
export function getWorkerFoodResource(eraKey) {
  return getEraIndex(eraKey) >= 1 ? "grain" : "cookedMeat";
}
