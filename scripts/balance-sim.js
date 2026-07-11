#!/usr/bin/env node
import { config } from "../js/core/config.js";

const eraOrder = Object.keys(config.eraData);
const resourceIds = Object.keys(config.resourceIcons ?? {});

function hashSeed(input) {
  let hash = 0x811c9dc5;
  for (const ch of input) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 0xC0FFEE;
}

function createRng(seed = 0xC0FFEE) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function createState({ prestige = false } = {}) {
  const resources = Object.fromEntries(resourceIds.map((id) => [id, 0]));
  Object.assign(resources, { sticks: 10, stones: 5, population: prestige ? 6 : 1 });

  if (prestige) {
    Object.assign(resources, { meat: 8, bones: 4, fur: 3, cookedMeat: 6 });
  }

  return {
    currentEra: "paleolithic",
    resources,
    workers: {},
    upgrades: {},
    lifetimeProduced: Object.fromEntries(resourceIds.map((id) => [id, 0])),
    elapsedSeconds: 0,
    actionCount: 0,
    failedActions: 0,
    softCappedResources: {},
    workerStarvationSeconds: 0,
    bottlenecks: {},
    eraReachedAt: { paleolithic: 0 },
    epEstimate: 0,
    perks: prestige ? ["quickStart", "firstWorkers"] : [],
  };
}

function add(state, resource, amount) {
  if (!Number.isFinite(amount) || amount === 0) return;
  const before = state.resources[resource] ?? 0;
  const after = Math.max(0, before + amount);
  state.resources[resource] = after;
  if (amount > 0) state.lifetimeProduced[resource] = (state.lifetimeProduced[resource] ?? 0) + Math.max(0, after - before);
}

function getSoftCapMultiplier(state, resource) {
  const caps = config.softCaps;
  if (!caps?.enabled) return 1;
  const eraIdx = config.resourceEra?.[resource];
  if (eraIdx === undefined) return 1;
  const baseCap = caps.base?.[eraIdx];
  if (!baseCap) return 1;

  const population = state.resources.population || 1;
  const popMult = 1 + Math.log10(1 + population) * (caps.popFactor || 0);
  const eraData = config.eraData?.[eraOrder[eraIdx]];
  const workersInEra = (eraData?.workers ?? []).reduce((sum, worker) => sum + (state.workers[worker.id] ?? 0), 0);
  const workerMult = 1 + workersInEra * (caps.workerFactor || 0);
  const effectiveCap = baseCap * popMult * workerMult;
  if ((state.resources[resource] ?? 0) < effectiveCap) return 1;

  state.softCappedResources[resource] = (state.softCappedResources[resource] ?? 0) + 1;
  return caps.capPenalty || 0.25;
}

function cloneProbeState(state) {
  return {
    ...state,
    resources: { ...state.resources },
    workers: { ...state.workers },
    upgrades: { ...state.upgrades },
    lifetimeProduced: { ...state.lifetimeProduced },
    softCappedResources: { ...state.softCappedResources },
    bottlenecks: { ...state.bottlenecks },
    eraReachedAt: { ...state.eraReachedAt },
    perks: [...state.perks],
  };
}

function canAfford(state, cost = {}) {
  return Object.entries(cost).every(([resource, amount]) => (state.resources[resource] ?? 0) >= amount);
}

function spend(state, cost = {}) {
  if (!canAfford(state, cost)) return false;
  Object.entries(cost).forEach(([resource, amount]) => {
    // Population is an advancement threshold in the game, not a currency.
    if (resource !== "population") add(state, resource, -amount);
  });
  return true;
}

function trackBottleneck(state, cost = {}, prefix = "cost") {
  Object.entries(cost).forEach(([resource, amount]) => {
    const have = state.resources[resource] ?? 0;
    if (have < amount) {
      const key = `${prefix}:${resource}`;
      state.bottlenecks[key] = (state.bottlenecks[key] ?? 0) + (amount - have);
    }
  });
}

function applyProduction(state, produces = {}, multiplier = 1, useSoftCaps = false) {
  Object.entries(produces).forEach(([resource, amount]) => {
    const softCapMultiplier = useSoftCaps ? getSoftCapMultiplier(state, resource) : 1;
    add(state, resource, amount * multiplier * softCapMultiplier);
  });
}

function performAction(state, action, rng) {
  if (action.requiresUpgrade && !state.upgrades[action.requiresUpgrade]) return false;
  if (!canAfford(state, action.consumes)) {
    trackBottleneck(state, action.consumes, `action:${action.id}`);
    state.failedActions += 1;
    return false;
  }

  spend(state, action.consumes);
  state.actionCount += 1;
  if (action.failChance && rng() < action.failChance) {
    state.failedActions += 1;
    return false;
  }

  applyProduction(state, action.produces);
  Object.entries(action.bonusChance ?? {}).forEach(([resource, bonus]) => {
    if (rng() < bonus.probability) add(state, resource, bonus.amount);
  });
  return true;
}

function buyAvailableUpgrades(state, eraData) {
  let bought = 0;
  for (const upgrade of [...(eraData.upgrades ?? [])].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))) {
    if (state.upgrades[upgrade.id]) continue;
    if (upgrade.requiresUpgrade && !state.upgrades[upgrade.requiresUpgrade]) continue;
    if (spend(state, upgrade.cost)) {
      state.upgrades[upgrade.id] = true;
      bought += 1;
    } else {
      trackBottleneck(state, upgrade.cost, `upgrade:${upgrade.id}`);
    }
  }
  return bought;
}

function hireWorkers(state, eraData, maxPerType = 6) {
  let hired = 0;
  for (const worker of eraData.workers ?? []) {
    if ((state.workers[worker.id] ?? 0) >= maxPerType) continue;
    if (worker.requiresUpgrade && !state.upgrades[worker.requiresUpgrade]) continue;
    if (spend(state, worker.cost)) {
      state.workers[worker.id] = (state.workers[worker.id] ?? 0) + 1;
      hired += 1;
    } else {
      trackBottleneck(state, worker.cost, `worker:${worker.id}`);
    }
  }
  return hired;
}

function runWorkers(state, seconds) {
  const eraData = config.eraData[state.currentEra];
  for (const worker of eraData.workers ?? []) {
    const count = state.workers[worker.id] ?? 0;
    if (!count) continue;
    const cycles = Math.floor((seconds * 1000) / worker.interval);
    for (let i = 0; i < cycles; i += 1) {
      let activeWorkers = count;
      if (worker.consumes) {
        activeWorkers = Math.min(
          activeWorkers,
          ...Object.entries(worker.consumes).map(([resource, amount]) => Math.floor((state.resources[resource] ?? 0) / amount)),
        );
        if (activeWorkers <= 0) {
          state.workerStarvationSeconds += worker.interval / 1000;
          trackBottleneck(state, worker.consumes, `worker-input:${worker.id}`);
          continue;
        }
        Object.entries(worker.consumes).forEach(([resource, amount]) => add(state, resource, -amount * activeWorkers));
      }
      const duplicatePenalty = Math.max(0.5, 1 - Math.max(0, count - 1) * (config.balance?.workerDiminishingReturns ?? 0.05));
      applyProduction(state, worker.produces, activeWorkers * duplicatePenalty, true);
    }
  }
}

function advanceIfReady(state) {
  const currentIdx = eraOrder.indexOf(state.currentEra);
  const eraData = config.eraData[state.currentEra];
  if (currentIdx >= eraOrder.length - 1 || !eraData?.advancementCost) return false;
  if (!spend(state, eraData.advancementCost)) {
    trackBottleneck(state, eraData.advancementCost, `advance:${state.currentEra}`);
    return false;
  }
  state.currentEra = eraOrder[currentIdx + 1];
  state.eraReachedAt[state.currentEra] = state.elapsedSeconds;
  return true;
}

function growPopulation(state, seconds) {
  const eraIdx = eraOrder.indexOf(state.currentEra);
  const cap = config.balance?.maxPopulationPerEra?.[state.currentEra] ?? 50;
  const current = state.resources.population ?? 0;
  if (current >= cap) return;
  const foodResource = eraIdx >= 1 ? "grain" : "cookedMeat";
  const availableFood = state.resources[foodResource] ?? 0;
  if (availableFood <= 0) return;
  const growthRate = config.balance?.populationGrowth?.baseRate ?? 0.001;
  const growth = Math.min(cap - current, availableFood, current * growthRate * seconds);
  if (growth > 0) {
    add(state, foodResource, -growth);
    add(state, "population", growth);
  }
}

function estimateEp(state) {
  const total = Object.values(state.lifetimeProduced).reduce((sum, amount) => sum + amount, 0);
  return Math.floor(Math.sqrt(total) / 4);
}

function collectNeededResources(state, eraData) {
  const needed = { ...(eraData.advancementCost ?? {}) };
  for (const upgrade of [...(eraData.upgrades ?? [])].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))) {
    if (state.upgrades[upgrade.id]) continue;
    if (upgrade.requiresUpgrade && !state.upgrades[upgrade.requiresUpgrade]) continue;
    Object.entries(upgrade.cost ?? {}).forEach(([resource, amount]) => {
      needed[resource] = Math.max(needed[resource] ?? 0, amount);
    });
    break;
  }
  return Object.fromEntries(Object.entries(needed).filter(([resource, amount]) => (state.resources[resource] ?? 0) < amount));
}

function chooseAction(state, eraData) {
  const availableActions = (eraData.actions ?? []).filter((action) => {
    if (action.requiresUpgrade && !state.upgrades[action.requiresUpgrade]) return false;
    return canAfford(state, action.consumes);
  });
  if (availableActions.length === 0) return null;

  const needed = collectNeededResources(state, eraData);
  const scored = availableActions.map((action, index) => {
    let score = 0;
    Object.keys(action.produces ?? {}).forEach((resource) => {
      if (needed[resource]) score += 10 + needed[resource];
    });
    Object.entries(action.bonusChance ?? {}).forEach(([resource, bonus]) => {
      if (needed[resource]) score += (10 + needed[resource]) * bonus.probability;
    });
    Object.keys(action.consumes ?? {}).forEach((resource) => {
      if (needed[resource]) score -= 5;
    });
    return { action, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0].action;
}

const scenarioDefs = [
  { name: "active-click-heavy", seconds: 60 * 60 * 3, step: 10, clicksPerStep: 5, hireLimit: 3 },
  { name: "idle-worker-heavy", seconds: 60 * 60 * 8, step: 30, clicksPerStep: 1, hireLimit: 10 },
  { name: "no-prestige-baseline", seconds: 60 * 60 * 12, step: 30, clicksPerStep: 2, hireLimit: 6 },
  { name: "prestige-fixed-perks", seconds: 60 * 60 * 6, step: 20, clicksPerStep: 3, hireLimit: 8, prestige: true },
];

function runScenario(def) {
  const rng = createRng(hashSeed(def.name));
  const state = createState(def);

  for (; state.elapsedSeconds < def.seconds; state.elapsedSeconds += def.step) {
    const eraData = config.eraData[state.currentEra];
    for (let i = 0; i < def.clicksPerStep; i += 1) {
      const action = chooseAction(state, eraData);
      if (action) performAction(state, action, rng);
    }
    runWorkers(state, def.step);
    growPopulation(state, def.step);
    buyAvailableUpgrades(state, eraData);
    hireWorkers(state, eraData, def.hireLimit);
    advanceIfReady(state);
  }

  const onlineProbe = cloneProbeState(state);
  const offlineProbe = cloneProbeState(state);

  runWorkers(onlineProbe, 300);
  runWorkers(offlineProbe, 60);
  runWorkers(offlineProbe, 60);
  runWorkers(offlineProbe, 60);
  runWorkers(offlineProbe, 60);
  runWorkers(offlineProbe, 60);
  const onlineOfflineDelta = Math.abs((onlineProbe.resources.sticks ?? 0) - (offlineProbe.resources.sticks ?? 0));

  state.epEstimate = estimateEp(state);
  const topBottlenecks = Object.entries(state.bottlenecks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, pressure]) => ({ key, pressure: Number(pressure.toFixed(2)) }));

  return {
    name: def.name,
    elapsedSeconds: state.elapsedSeconds,
    finalEra: state.currentEra,
    eraReachedAt: state.eraReachedAt,
    actions: state.actionCount,
    failedActions: state.failedActions,
    epEstimate: state.epEstimate,
    softCappedResources: Object.keys(state.softCappedResources),
    workerStarvationSeconds: Number(state.workerStarvationSeconds.toFixed(1)),
    topBottlenecks,
    onlineOfflineDelta: Number(onlineOfflineDelta.toFixed(4)),
  };
}

const scenarios = scenarioDefs.map(runScenario);
const warnings = [];
const active = scenarios.find((scenario) => scenario.name === "active-click-heavy");
if (!active?.eraReachedAt.neolithic) warnings.push("active-click-heavy did not reach Neolithic within 3h simulated time");
const idle = scenarios.find((scenario) => scenario.name === "idle-worker-heavy");
if ((idle?.workerStarvationSeconds ?? 0) > 60 * 60) warnings.push("idle-worker-heavy workers starved for more than 1h simulated time");
for (const scenario of scenarios) {
  if (scenario.onlineOfflineDelta > 0.0001) warnings.push(`${scenario.name} offline-vs-online probe drifted by ${scenario.onlineOfflineDelta}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  seedPolicy: "LCG seeded per scenario name for repeatable bonus/failure rolls",
  thresholds: {
    activeClickHeavyNeolithicSeconds: 60 * 60 * 3,
    idleWorkerStarvationWarnSeconds: 60 * 60,
    onlineOfflineDeltaMax: 0.0001,
  },
  scenarios,
  warnings,
};

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--strict") && warnings.length > 0) process.exitCode = 1;
