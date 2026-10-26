// time-accurate playthrough simulator for balance work
//
// drives the real GameManager on a virtual clock so worker intervals, click
// cooldowns, population growth, events and trade routes all run at their real
// rates. a scripted player clicks at a human pace, buys what it can afford and
// advances as soon as the era allows it.
//
//   node scripts/simulate-play.js [--seeds 5] [--cps 2] [--hours 6] [--verbose]

import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    seeds: { type: "string", default: "5" },
    cps: { type: "string", default: "2" },
    hours: { type: "string", default: "6" },
    stall: { type: "string", default: "45" },
    verbose: { type: "boolean", default: false },
    // worst case: drop every carried-over resource on era entry so each era
    // has to bootstrap from its starter pack alone
    wipe: { type: "boolean", default: false },
    // prestige after each run, buy affordable perks and play again
    runs: { type: "string", default: "1" },
  },
});

const SEEDS = Number(args.seeds);
const CLICKS_PER_SECOND = Number(args.cps);
const MAX_HOURS = Number(args.hours);
const STALL_MINUTES = Number(args.stall);
const RUNS = Number(args.runs);
const TICK_MS = 250;

// virtual clock ------------------------------------------------------------

let now = 1_700_000_000_000;
let nextTimerId = 1;
const timers = new Map();

function schedule(fn, delay, repeat) {
  const id = nextTimerId++;
  const ms = Math.max(1, Number(delay) || 0);
  timers.set(id, { fn, at: now + ms, every: repeat ? ms : 0 });
  return id;
}

globalThis.setTimeout = (fn, delay) => schedule(fn, delay, false);
globalThis.setInterval = (fn, delay) => schedule(fn, delay, true);
globalThis.clearTimeout = (id) => timers.delete(id);
globalThis.clearInterval = (id) => timers.delete(id);
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
Date.now = () => now;
Object.defineProperty(globalThis, "performance", {
  value: { now: () => now },
  configurable: true,
});

function advanceClock(ms) {
  const target = now + ms;
  for (;;) {
    let next = null;
    for (const [id, timer] of timers) {
      if (timer.at <= target && (!next || timer.at < next[1].at)) {
        next = [id, timer];
      }
    }
    if (!next) break;
    const [id, timer] = next;
    now = timer.at;
    if (timer.every) timer.at += timer.every;
    else timers.delete(id);
    timer.fn();
  }
  now = target;
}

const storage = new Map();
globalThis.window = { addEventListener() {}, removeEventListener() {} };
globalThis.document = { getElementById: () => null };
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const { GameManager } = await import("../js/GameManager.js");
const { config } = await import("../js/core/config.js");
const { scaleCost } = await import("../js/core/resourceUtils.js");

// scripted player ----------------------------------------------------------

function upgradeCost(manager, upgrade) {
  const mult =
    (manager.systems.prestigeManager?.getUpgradeCostMultiplier() || 1) *
    (config.balance?.upgradeCostMultiplier || 1);
  return scaleCost(upgrade.cost, mult);
}

// resources the player is currently short of, weighted towards advancing
function wantedResources(manager) {
  const state = manager.gameState;
  const era = manager.getCurrentEraData();
  const wanted = new Map();
  const want = (cost, weight) => {
    for (const [resource, amount] of Object.entries(cost || {})) {
      if (resource === "population") continue;
      const deficit = amount - state.getResource(resource);
      if (deficit > 0) {
        wanted.set(resource, (wanted.get(resource) || 0) + weight * deficit);
      }
    }
  };
  want(era.advancementCost, 3);
  for (const upgrade of era.upgrades) {
    if (state.hasUpgrade(upgrade.id)) continue;
    if (upgrade.requiresUpgrade && !state.hasUpgrade(upgrade.requiresUpgrade))
      continue;
    want(upgradeCost(manager, upgrade), 1);
  }
  for (const worker of era.workers) {
    if (worker.requiresUpgrade && !state.hasUpgrade(worker.requiresUpgrade))
      continue;
    const info = manager.systems.workerManager.getWorkerInfo(worker.id);
    if (info && info.count < 3) want(info.cost, 1);
  }
  return wanted;
}

function chooseClick(manager, rotation) {
  const actions = manager
    .getCurrentActionViews()
    .filter((action) => action.canAfford && !action.isOnCooldown);
  if (actions.length === 0) return null;

  const wanted = wantedResources(manager);
  let best = null;
  let bestScore = 0;
  for (const action of actions) {
    let score = 0;
    for (const resource of Object.keys(action.produces || {})) {
      score += wanted.get(resource) || 0;
    }
    for (const resource of Object.keys(action.bonusChance || {})) {
      score += (wanted.get(resource) || 0) * 0.3;
    }
    // never cook away the last of an input someone else is short of
    for (const resource of Object.keys(action.consumes || {})) {
      score -= (wanted.get(resource) || 0) * 0.5;
    }
    if (score > bestScore) {
      best = action;
      bestScore = score;
    }
  }
  return best || actions[rotation % actions.length];
}

function buyEverything(manager) {
  const state = manager.gameState;
  const era = manager.getCurrentEraData();
  let bought = 0;
  for (const upgrade of [...era.upgrades].sort(
    (a, b) => (a.priority || 0) - (b.priority || 0),
  )) {
    if (state.hasUpgrade(upgrade.id)) continue;
    if (upgrade.requiresUpgrade && !state.hasUpgrade(upgrade.requiresUpgrade))
      continue;
    if (!state.canAfford(upgradeCost(manager, upgrade))) continue;
    if (manager.buyUpgrade(upgrade.id)) bought++;
  }
  // hire the cheapest-count worker first so the fleet stays mixed
  const hireable = era.workers
    .map((worker) => manager.systems.workerManager.getWorkerInfo(worker.id))
    .filter((info) => info && info.requirementMet && info.canHire)
    .sort((a, b) => a.count - b.count);
  if (hireable.length > 0 && manager.hireWorker(hireable[0].id)) bought++;
  return bought;
}

function snapshot(manager) {
  const data = manager.gameState.data;
  const era = manager.getCurrentEraData();
  const needs = Object.fromEntries(
    Object.entries(era.advancementCost || {}).map(([resource, amount]) => [
      resource,
      `${Math.floor(manager.gameState.getResource(resource))}/${amount}`,
    ]),
  );
  return {
    era: data.currentEra,
    needs,
    workers: { ...data.workers },
    food: Object.fromEntries(
      Object.keys(data.workers).map((id) => [
        id,
        manager.systems.workerManager.getFoodStatus(id),
      ]),
    ),
    upgrades: era.upgrades
      .filter((upgrade) => !manager.gameState.hasUpgrade(upgrade.id))
      .map((upgrade) => upgrade.id),
  };
}

// logs the minute each advancement requirement is first met in an era
const metAt = new Map();
function traceRequirements(manager, eraStartedAt) {
  const era = manager.gameState.data.currentEra;
  const cost = manager.getCurrentEraData().advancementCost || {};
  for (const [resource, amount] of Object.entries(cost)) {
    const key = `${era}:${resource}`;
    if (metAt.has(key) || manager.gameState.getResource(resource) < amount) continue;
    metAt.set(key, (now - eraStartedAt) / 60000);
    console.log(`  ${era} ${resource} met at ${metAt.get(key).toFixed(1)}m`);
  }
}

function buyPerks(manager) {
  const pm = manager.systems.prestigeManager;
  for (;;) {
    const perk = pm
      .getTalentTree()
      .filter((candidate) => candidate.available)
      .sort((a, b) => a.cost - b.cost)[0];
    if (!perk || !manager.purchasePrestigePerk(perk.id)) return;
  }
}

async function runSeed(seed) {
  storage.clear();
  timers.clear();
  Math.random = mulberry32(seed);
  globalThis.confirm = () => true;

  const manager = new GameManager();
  await manager.initPromise;
  if (args.wipe) {
    const grantPack = manager.onEraTransition.bind(manager);
    manager.onEraTransition = (toEra) => {
      const resources = manager.gameState.data.resources;
      for (const resource of Object.keys(resources)) {
        if (resource !== "population") delete resources[resource];
      }
      grantPack(toEra);
    };
  }
  const runs = [];
  for (let run = 1; run <= RUNS; run++) {
    if (run > 1) {
      manager.performPrestige();
      buyPerks(manager);
    }
    runs.push(playRun(manager));
  }
  manager.destroy();
  return { seed, ...runs[0], runs };
}

function playRun(manager) {
  metAt.clear();

  const clickEvery = 1000 / CLICKS_PER_SECOND;
  let clickBudget = 0;
  let rotation = 0;
  let eraStartedAt = now;
  const startedAt = now;
  const eras = [];
  const finalEra = config.eraOrder[config.eraOrder.length - 1];
  let lastBuyCheck = 0;
  let minResourceCheck = null;

  while (now - startedAt < MAX_HOURS * 3600_000) {
    advanceClock(TICK_MS);
    manager.update(TICK_MS);

    clickBudget += TICK_MS;
    while (clickBudget >= clickEvery) {
      clickBudget -= clickEvery;
      const action = chooseClick(manager, rotation++);
      if (action) manager.doClickAction(action);
    }

    if (now - lastBuyCheck >= 1000) {
      lastBuyCheck = now;
      buyEverything(manager);

      for (const [resource, value] of Object.entries(
        manager.gameState.data.resources,
      )) {
        if (!Number.isFinite(value) || value < 0) {
          minResourceCheck = `${resource}=${value}`;
        }
      }

      if (manager.gameState.canAdvanceEra()) {
        const from = manager.gameState.data.currentEra;
        if (manager.advanceEra()) {
          eras.push({ era: from, minutes: (now - eraStartedAt) / 60000 });
          eraStartedAt = now;
          if (manager.gameState.data.currentEra === finalEra) break;
        }
      }

      if (args.verbose) traceRequirements(manager, eraStartedAt);
      if (now - eraStartedAt > STALL_MINUTES * 60000) break;
    }
  }

  const pm = manager.systems.prestigeManager;
  return {
    eras,
    epGain: pm.calculateEPGain(),
    multiplier: pm.getMultiplier(),
    reached: manager.gameState.data.currentEra,
    totalMinutes: (now - startedAt) / 60000,
    complete: manager.gameState.data.currentEra === finalEra,
    invalidResource: minResourceCheck,
    stuck: manager.gameState.data.currentEra === finalEra ? null : snapshot(manager),
  };
}

const results = [];
for (let seed = 1; seed <= SEEDS; seed++) {
  results.push(await runSeed(seed));
}

const perEra = new Map();
for (const result of results) {
  for (const { era, minutes } of result.eras) {
    if (!perEra.has(era)) perEra.set(era, []);
    perEra.get(era).push(minutes);
  }
}

console.log(`${args.wipe ? "wipe " : ""}seeds=${SEEDS} cps=${CLICKS_PER_SECOND} cap=${MAX_HOURS}h stall=${STALL_MINUTES}m`);
console.log("era            runs  median  min    max   (minutes to clear)");
for (const era of config.eraOrder) {
  const times = (perEra.get(era) || []).sort((a, b) => a - b);
  if (times.length === 0) continue;
  const median = times[Math.floor(times.length / 2)];
  console.log(
    `${era.padEnd(14)} ${String(times.length).padStart(4)}  ${median.toFixed(1).padStart(6)} ${times[0].toFixed(1).padStart(6)} ${times[times.length - 1].toFixed(1).padStart(6)}`,
  );
}
for (const result of results) {
  const status = result.complete
    ? `complete in ${result.totalMinutes.toFixed(0)}m`
    : `stopped in ${result.reached} after ${result.totalMinutes.toFixed(0)}m`;
  console.log(`seed ${result.seed}: ${status}${result.invalidResource ? ` invalid ${result.invalidResource}` : ""}`);
  if (RUNS > 1) {
    result.runs.forEach((run, index) => {
      const outcome = run.complete
        ? `${run.totalMinutes.toFixed(0)}m`
        : `stuck in ${run.reached} at ${run.totalMinutes.toFixed(0)}m`;
      console.log(`  run ${index + 1}: ${outcome}, x${run.multiplier.toFixed(2)} production, would earn ${run.epGain} EP`);
      if (!run.complete) console.log(`    ${JSON.stringify(run.stuck)}`);
    });
  }
  if (result.stuck && (args.verbose || !result.complete)) {
    console.log(`  ${JSON.stringify(result.stuck)}`);
  }
}
