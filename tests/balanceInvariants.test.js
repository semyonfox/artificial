import assert from "node:assert/strict";
import test from "node:test";

import { GameState } from "../js/core/GameState.js";
import { config } from "../js/core/config.js";
import { OfflineManager } from "../js/systems/OfflineManager.js";
import { PrestigeManager } from "../js/systems/PrestigeManager.js";
import { WorkerManager } from "../js/systems/WorkerManager.js";

// live findings referenced by skipped tests below (verified against real modules):
//
// FINDING-1 (herder/livestock, neolithic): livestock's only producer anywhere
// in config is the herder worker itself, whose hire cost includes 2 livestock.
// hiring one works only because the one-time neolithic starter pack grants
// floor(12 x 0.55) = 6 livestock; no renewable seed producer exists.
//
// FINDING-2 (miller/mills, medieval): mills' only producer is the miller
// itself. the medieval pack grant is floor(8 x 0.55) = 4 < 5 mills needed for
// the first hire, so the miller is unhireable in normal play (only the random
// "Watermills Spread" event ever adds mills). dead content, and it starves the
// medieval population-support pool of its intended automated agriculture/mills
// producer.

test("config references resolve: every cost, output, and prerequisite names a real thing", () => {
  const knownResources = new Set(Object.keys(config.resourceEra));
  const knownUpgrades = new Set();
  const displayedResources = new Set();
  for (const resources of Object.values(config.resourcesByEra)) {
    for (const resource of resources) displayedResources.add(resource);
  }
  for (const era of config.eraOrder) {
    for (const upgrade of config.eraData[era].upgrades || []) {
      knownUpgrades.add(upgrade.id);
    }
  }

  const violations = [];
  const checkCost = (era, kind, id, cost) => {
    for (const [resource, amount] of Object.entries(cost || {})) {
      if (!knownResources.has(resource)) {
        violations.push(
          `${era} ${kind} ${id} costs unknown resource ${resource}`,
        );
      }
      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        violations.push(
          `${era} ${kind} ${id} cost for ${resource} is not a positive number: ${amount}`,
        );
      }
    }
  };
  const checkRequiresUpgrade = (era, kind, id, requiresUpgrade) => {
    if (requiresUpgrade && !knownUpgrades.has(requiresUpgrade)) {
      violations.push(
        `${era} ${kind} ${id} requires unknown upgrade ${requiresUpgrade}`,
      );
    }
  };

  const seenWorkers = new Map();
  const seenUpgrades = new Map();
  const costReferencedResources = new Set();

  for (const era of config.eraOrder) {
    const eraData = config.eraData[era];

    // workers and upgrades key persistent cross-era state
    // (data.workers / data.upgrades), so their ids must be globally unique.
    // actions only ever coexist within one era's UI and their cooldown map is
    // cleared on every transition, so they are checked per-era below.
    const seenActionsInEra = new Set();

    for (const action of eraData.actions || []) {
      if (seenActionsInEra.has(action.id)) {
        violations.push(`duplicate action id ${action.id} in ${era}`);
      }
      seenActionsInEra.add(action.id);
      for (const key of ["produces", "consumes", "bonusChance"]) {
        for (const resource of Object.keys(action[key] || {})) {
          if (!knownResources.has(resource)) {
            violations.push(
              `${era} action ${action.id} references unknown resource ${resource} in ${key}`,
            );
          }
        }
      }
      for (const [resource, info] of Object.entries(action.bonusChance || {})) {
        if (typeof info?.probability !== "number" || info.probability <= 0) {
          violations.push(
            `${era} action ${action.id} bonusChance for ${resource} lacks a positive probability`,
          );
        }
        if (typeof info?.amount !== "number" || info.amount <= 0) {
          violations.push(
            `${era} action ${action.id} bonusChance for ${resource} lacks a positive amount`,
          );
        }
      }
      checkCost(era, "action", action.id, action.consumes);
      checkRequiresUpgrade(era, "action", action.id, action.requiresUpgrade);
    }

    for (const worker of eraData.workers || []) {
      if (seenWorkers.has(worker.id)) {
        violations.push(
          `duplicate worker id ${worker.id} in ${era} and ${seenWorkers.get(worker.id)}`,
        );
      }
      seenWorkers.set(worker.id, era);
      checkCost(era, "worker", worker.id, worker.cost);
      for (const key of ["produces", "consumes"]) {
        for (const [resource, amount] of Object.entries(worker[key] || {})) {
          if (!knownResources.has(resource)) {
            violations.push(
              `${era} worker ${worker.id} references unknown resource ${resource} in ${key}`,
            );
          }
          if (
            key === "consumes" &&
            (typeof amount !== "number" || amount <= 0)
          ) {
            violations.push(
              `${era} worker ${worker.id} consume amount for ${resource} is not positive`,
            );
          }
        }
      }
      checkRequiresUpgrade(era, "worker", worker.id, worker.requiresUpgrade);
    }

    for (const upgrade of eraData.upgrades || []) {
      if (seenUpgrades.has(upgrade.id)) {
        violations.push(
          `duplicate upgrade id ${upgrade.id} in ${era} and ${seenUpgrades.get(upgrade.id)}`,
        );
      }
      seenUpgrades.set(upgrade.id, era);
      checkCost(era, "upgrade", upgrade.id, upgrade.cost);
      checkRequiresUpgrade(era, "upgrade", upgrade.id, upgrade.requiresUpgrade);
    }

    if (eraData.advancementCost != null) {
      checkCost(era, "advancement", era, eraData.advancementCost);
    }
  }

  // every resource any gate charges must be displayable
  for (const era of config.eraOrder) {
    const eraData = config.eraData[era];
    for (const worker of eraData.workers || []) {
      Object.keys(worker.cost || {}).forEach((r) =>
        costReferencedResources.add(r),
      );
    }
    for (const upgrade of eraData.upgrades || []) {
      Object.keys(upgrade.cost || {}).forEach((r) =>
        costReferencedResources.add(r),
      );
    }
    for (const action of eraData.actions || []) {
      Object.keys(action.consumes || {}).forEach((r) =>
        costReferencedResources.add(r),
      );
    }
    if (eraData.advancementCost != null) {
      Object.keys(eraData.advancementCost).forEach((r) =>
        costReferencedResources.add(r),
      );
    }
  }

  assert.deepEqual(violations, []);
});

test(
  "every costed resource has display metadata",
  {
    // FINDING-3: electricity is produced, spent, and part of the population
    // support pool from industrial onward, but appears in no resourcesByEra
    // list, so ResourcePanel (which filters on getRelevantResources) never
    // renders it. unskip once electricity is added to a resourcesByEra list.
  },
  () => {
    const displayedResources = new Set();
    for (const resources of Object.values(config.resourcesByEra)) {
      for (const resource of resources) displayedResources.add(resource);
    }

    const costed = new Set();
    for (const era of config.eraOrder) {
      const eraData = config.eraData[era];
      for (const worker of eraData.workers || []) {
        Object.keys(worker.cost || {}).forEach((r) => costed.add(r));
      }
      for (const upgrade of eraData.upgrades || []) {
        Object.keys(upgrade.cost || {}).forEach((r) => costed.add(r));
      }
      for (const action of eraData.actions || []) {
        Object.keys(action.consumes || {}).forEach((r) => costed.add(r));
      }
      if (eraData.advancementCost != null) {
        Object.keys(eraData.advancementCost).forEach((r) => costed.add(r));
      }
    }

    const violations = [];
    for (const resource of costed) {
      if (!config.resourceIcons?.[resource]) {
        violations.push(`costed resource ${resource} has no display icon`);
      }
      if (!displayedResources.has(resource)) {
        violations.push(
          `costed resource ${resource} never appears in resourcesByEra`,
        );
      }
    }
    assert.deepEqual(violations, []);
  },
);

test(
  "every upgrade and worker is purchasable in the era that sells it",
  {
    // FINDING-1 / FINDING-2: this walk flags the neolithic herder (livestock has
    // no producer except the self-gated herder) and the medieval miller (mills
    // ditto). unskip once those chains gain an independent renewable producer.
  },
  () => {
    const reachable = new Set(["population"]);
    const unlocked = new Set();

    for (const era of config.eraOrder) {
      const eraData = config.eraData[era];
      let changed = true;
      let safety = 0;
      while (changed && safety < 500) {
        changed = false;
        safety++;

        for (const action of eraData.actions || []) {
          if (action.requiresUpgrade && !unlocked.has(action.requiresUpgrade))
            continue;
          if (
            action.consumes &&
            !Object.keys(action.consumes).every((r) => reachable.has(r))
          )
            continue;
          for (const r of Object.keys(action.produces || {})) {
            if (!reachable.has(r)) {
              reachable.add(r);
              changed = true;
            }
          }
          for (const r of Object.keys(action.bonusChance || {})) {
            if (!reachable.has(r)) {
              reachable.add(r);
              changed = true;
            }
          }
        }

        for (const upgrade of eraData.upgrades || []) {
          if (unlocked.has(upgrade.id)) continue;
          if (upgrade.requiresUpgrade && !unlocked.has(upgrade.requiresUpgrade))
            continue;
          if (!Object.keys(upgrade.cost || {}).every((r) => reachable.has(r)))
            continue;
          unlocked.add(upgrade.id);
          changed = true;
        }

        for (const worker of eraData.workers || []) {
          if (worker.requiresUpgrade && !unlocked.has(worker.requiresUpgrade))
            continue;
          if (!Object.keys(worker.cost || {}).every((r) => reachable.has(r)))
            continue;
          if (
            worker.consumes &&
            !Object.keys(worker.consumes).every((r) => reachable.has(r))
          )
            continue;
          for (const r of Object.keys(worker.produces || {})) {
            if (!reachable.has(r)) {
              reachable.add(r);
              changed = true;
            }
          }
        }
      }

      // stockpiles carry forward across eras so reachability accumulates; each
      // era must still be able to pay every gate it sells from what it produces
      const problems = [];
      for (const upgrade of eraData.upgrades || []) {
        const missing = Object.keys(upgrade.cost || {}).filter(
          (r) => !reachable.has(r),
        );
        if (missing.length > 0) {
          problems.push(
            `upgrade ${upgrade.id} can never be paid (${missing.join(", ")} unreachable)`,
          );
        } else if (
          upgrade.requiresUpgrade &&
          !unlocked.has(upgrade.requiresUpgrade)
        ) {
          problems.push(
            `upgrade ${upgrade.id} prereq ${upgrade.requiresUpgrade} can never be unlocked`,
          );
        }
      }
      for (const worker of eraData.workers || []) {
        const missing = Object.keys(worker.cost || {}).filter(
          (r) => !reachable.has(r),
        );
        if (missing.length > 0) {
          problems.push(
            `worker ${worker.id} can never be hired (${missing.join(", ")} unreachable)`,
          );
        }
      }
      const missingAdvancement = Object.keys(
        eraData.advancementCost || {},
      ).filter((r) => !reachable.has(r));
      if (missingAdvancement.length > 0) {
        problems.push(
          `advancement blocked (${missingAdvancement.join(", ")} unreachable)`,
        );
      }
      assert.deepEqual(
        problems,
        [],
        `era ${era} sells content that can never be paid for:\n${problems.join("\n")}`,
      );
    }
  },
);

test(
  "production chains never depend on their own output without a renewable seed",
  {
    // FINDING-1 / FINDING-2: sole producers of livestock (neolithic herder) and
    // mills (medieval miller) are gated behind their own purchase. unskip once
    // independent producers exist.
  },
  () => {
    const producersOf = new Map();
    const addProducer = (resource, producer) => {
      if (!producersOf.has(resource)) producersOf.set(resource, []);
      producersOf.get(resource).push(producer);
    };

    config.eraOrder.forEach((eraId) => {
      const eraData = config.eraData[eraId];
      for (const action of eraData.actions || []) {
        for (const r of Object.keys(action.produces || {})) {
          addProducer(r, {
            kind: "action",
            id: action.id,
            era: eraId,
            requiresUpgrade: action.requiresUpgrade || null,
          });
        }
        for (const r of Object.keys(action.bonusChance || {})) {
          addProducer(r, {
            kind: "bonus",
            id: action.id,
            era: eraId,
            requiresUpgrade: action.requiresUpgrade || null,
          });
        }
      }
      for (const worker of eraData.workers || []) {
        for (const r of Object.keys(worker.produces || {})) {
          addProducer(r, {
            kind: "worker",
            id: worker.id,
            era: eraId,
            requiresUpgrade: worker.requiresUpgrade || null,
          });
        }
      }
    });
    for (const route of Object.values(config.tradeRoutes || {})) {
      for (const r of Object.keys(route.produces || {})) {
        addProducer(r, {
          kind: "route",
          id: route.id,
          era: route.unlockEra,
          requiresUpgrade: null,
        });
      }
    }

    const eraIndex = (eraKey) => config.eraOrder.indexOf(eraKey);
    const problems = [];

    config.eraOrder.forEach((eraId) => {
      const eraData = config.eraData[eraId];
      const gates = [];
      for (const worker of eraData.workers || []) {
        for (const r of Object.keys(worker.cost || {})) {
          gates.push({ kind: "worker hire", id: worker.id, resource: r });
        }
      }
      for (const upgrade of eraData.upgrades || []) {
        for (const r of Object.keys(upgrade.cost || {})) {
          gates.push({ kind: "upgrade purchase", id: upgrade.id, resource: r });
        }
      }
      for (const action of eraData.actions || []) {
        for (const r of Object.keys(action.consumes || {})) {
          gates.push({ kind: "action upkeep", id: action.id, resource: r });
        }
      }

      for (const gate of gates) {
        const producers = producersOf.get(gate.resource) || [];
        // a producer is gated behind the purchase itself when it IS the worker
        // being hired, or when it only exists after the upgrade being bought
        const external = producers.filter((p) => {
          if (
            gate.kind === "worker hire" &&
            p.kind === "worker" &&
            p.id === gate.id
          )
            return false;
          if (gate.kind === "upgrade purchase" && p.requiresUpgrade === gate.id)
            return false;
          return true;
        });
        const describe = (list) =>
          list.map((p) => `${p.kind}:${p.id}@${p.era}`).join(", ") ||
          "no producers at all";
        const label = `${eraId} ${gate.kind} ${gate.id} needs ${gate.resource}`;

        if (external.length === 0) {
          problems.push(
            `${label}: dead end, every producer is gated behind the purchase itself (${describe(producers)})`,
          );
          continue;
        }
        if (!external.some((p) => eraIndex(p.era) <= eraIndex(eraId))) {
          problems.push(
            `${label}: only later-era producers exist (${describe(external)})`,
          );
          continue;
        }
        if (
          gate.kind === "worker hire" &&
          external.length === 1 &&
          external[0].kind === "worker" &&
          external[0].id === gate.id
        ) {
          problems.push(
            `${label}: the only independent producer is the same worker being hired; ` +
              "the chain relies on a non-renewable one-time grant",
          );
        }
      }
    });

    assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
  },
);

test("prestige math is monotone and self-consistent", () => {
  const state = new GameState();
  const pm = new PrestigeManager(state);

  let previousGain = -1;
  for (const amount of [1, 10, 1e3, 1e6]) {
    state.data.lifetimeProduced = { sticks: amount };
    const gain = pm.calculateEPGain();
    assert.ok(
      Number.isFinite(gain) && gain >= 0,
      `gain for ${amount} sticks invalid`,
    );
    assert.ok(
      gain >= previousGain,
      `EP gain decreased from ${previousGain} to ${gain} at ${amount} sticks`,
    );
    previousGain = gain;
  }

  state.data.lifetimeProduced = { sticks: 1000 };
  const shallowGain = pm.calculateEPGain();
  state.data.lifetimeProduced = { coins: 1000 };
  const deepGain = pm.calculateEPGain();
  assert.ok(shallowGain > 0);
  assert.ok(
    deepGain >= shallowGain,
    "deeper-tier production must not yield less EP than shallower",
  );

  state.data.lifetimeProduced = { sticks: 5000 };
  state.data.currentEra = "neolithic";
  const expected = pm.calculateEPGain();
  assert.ok(expected > 0, "expected a nonzero EP gain before prestiging");
  const gained = pm.prestige();
  assert.equal(gained, expected);
  const prestige = pm.getPrestigeData();
  assert.equal(prestige.evolutionPoints, expected);
  assert.equal(prestige.lifetimeEP, expected);
  assert.equal(prestige.totalResets, 1);

  assert.equal(
    pm.calculateEPGain(),
    0,
    "unchanged lifetime production must yield zero EP after prestige",
  );
  state.data.currentEra = "neolithic";
  assert.equal(
    pm.prestige(),
    0,
    "prestiging twice without new production banks nothing",
  );

  let previousMultiplier = 0;
  for (const lifetimeEP of [0, 1, 10, 1e3, 1e6]) {
    prestige.lifetimeEP = lifetimeEP;
    const multiplier = pm.getMultiplier();
    assert.ok(
      Number.isFinite(multiplier) && multiplier >= 1,
      `multiplier out of bounds at ${lifetimeEP} lifetime EP`,
    );
    assert.ok(
      multiplier >= previousMultiplier,
      "multiplier must be non-decreasing in lifetime EP",
    );
    previousMultiplier = multiplier;
  }
});

test("soft caps only ever reduce yield, and never to zero", () => {
  const state = new GameState();
  const wm = new WorkerManager(state);

  for (const [resource, tier] of Object.entries(config.resourceEra)) {
    if (!config.softCaps.base[tier]) continue;
    const cap = wm.getEffectiveSoftCap(resource);
    assert.ok(Number.isFinite(cap), `${resource} cap not finite`);
    assert.ok(cap > 0, `${resource} cap must be positive`);

    delete state.data.resources[resource];
    assert.equal(
      wm.getSoftCapMultiplier(resource),
      1,
      `${resource} below-cap yield must be unpenalized`,
    );
    state.data.resources[resource] = cap * 10;
    assert.equal(
      wm.getSoftCapMultiplier(resource),
      config.softCaps.capPenalty,
      `${resource} above-cap yield must drop exactly to capPenalty`,
    );
    delete state.data.resources[resource];
  }
  assert.ok(
    config.softCaps.capPenalty > 0,
    "above-cap production would hard-stop",
  );

  // raising population or same-era worker counts never lowers the effective cap
  for (const [resource, tier] of Object.entries(config.resourceEra)) {
    if (!config.softCaps.base[tier]) continue;
    const eraKey = config.eraOrder[tier];
    const eraWorkers = (config.eraData[eraKey]?.workers || []).map((w) => w.id);
    // baseline cap per same-era worker count, so each axis is checked
    // independently: more population never lowers the cap at a fixed fleet
    // size, and more workers never lower it at a fixed population
    const capByWorkerCount = new Map();
    for (const population of [1, 10, 100, 5000]) {
      state.data.resources.population = population;
      let previousAtFixedPopulation = -Infinity;
      for (const workerCount of [0, 5, 25]) {
        state.data.workers = {};
        for (const id of eraWorkers) state.data.workers[id] = workerCount;
        const cap = wm.getEffectiveSoftCap(resource);
        assert.ok(Number.isFinite(cap) && cap > 0);
        if (capByWorkerCount.has(workerCount)) {
          assert.ok(
            cap >= capByWorkerCount.get(workerCount),
            `${resource} cap fell when population rose to ${population} (${workerCount} workers)`,
          );
        }
        assert.ok(
          cap >= previousAtFixedPopulation,
          `${resource} cap fell when ${eraKey} worker counts rose to ${workerCount}`,
        );
        capByWorkerCount.set(workerCount, cap);
        previousAtFixedPopulation = cap;
      }
    }
    state.data.workers = {};
    delete state.data.resources.population;
  }

  // behavioral echo: a worker far above cap keeps producing positive amounts
  const echoState = new GameState();
  echoState.data.workers.gatherer = 1;
  echoState.data.resources.sticks = 1e9;
  const echoManager = new WorkerManager(echoState);
  const gatherer = config.eraData.paleolithic.workers.find(
    (w) => w.id === "gatherer",
  );
  const before = echoState.getResource("sticks");
  for (let cycle = 0; cycle < 60; cycle++) {
    echoManager.performWorkerWork("gatherer", gatherer);
  }
  assert.ok(
    echoState.getResource("sticks") > before,
    "production ceased entirely while far above the soft cap",
  );
});

test("worker economy bounds hold for any config", () => {
  const state = new GameState();
  const wm = new WorkerManager(state);

  // cost scaling is flat-to-rising, never negative-sloping
  for (const era of config.eraOrder) {
    for (const worker of config.eraData[era].workers || []) {
      let previousCost = {};
      for (let count = 0; count <= 25; count++) {
        const cost = wm.calculateWorkerCost(worker.cost, count);
        for (const [resource, amount] of Object.entries(cost)) {
          assert.ok(
            Number.isFinite(amount) && amount > 0,
            `${worker.id} cost for ${resource} invalid at count ${count}`,
          );
          assert.ok(
            amount >= (previousCost[resource] || 0),
            `${worker.id} cost for ${resource} dropped from ${previousCost[resource]} to ${amount}`,
          );
        }
        previousCost = cost;
      }

      // diminishing returns stay in (0, 1], never increase, and are pure
      state.data.workers = {};
      let previousFactor = Infinity;
      for (let count = 1; count <= 40; count++) {
        state.data.workers[worker.id] = count;
        const factor = wm.getDiminishingReturnsFactor(worker.id);
        assert.ok(
          factor > 0 && factor <= 1,
          `${worker.id} factor ${factor} out of range at ${count}`,
        );
        assert.ok(
          factor <= previousFactor,
          `${worker.id} factor increased at count ${count}`,
        );
        assert.equal(
          factor,
          wm.getDiminishingReturnsFactor(worker.id),
          `${worker.id} factor is not a pure function of count`,
        );
        previousFactor = factor;
      }
      state.data.workers = {};
    }
  }

  // intervals stay positive, including every interval-reducing effect at once
  const allIntervalPerks = {
    systems: {
      prestigeManager: { getWorkerIntervalMultiplier: () => 0.85 * 0.7 },
    },
  };
  for (const withPerks of [false, true]) {
    const intervalState = new GameState();
    const intervalManager = new WorkerManager(intervalState);
    if (withPerks) {
      intervalManager.setGameManager(allIntervalPerks);
      intervalState.data.eraSpecializations.industrial = "roboticAge";
    }
    for (const era of config.eraOrder) {
      for (const worker of config.eraData[era].workers || []) {
        const interval = intervalManager.getEffectiveInterval(worker);
        assert.ok(
          Number.isFinite(interval) && interval >= 500,
          `${worker.id} interval ${interval} invalid${withPerks ? " with all perks owned" : ""}`,
        );
      }
    }
  }

  // hiring must refuse rather than desync workers from population
  state.data.resources = {
    population: 5,
    sticks: 1e6,
    stones: 1e6,
    meat: 1e6,
    bones: 1e6,
  };
  wm.setGameManager({
    getCurrentEraData: () => config.eraData.paleolithic,
    showNotification: () => {},
    getWorkerSpecializationMultiplier: () => 1,
    getSpecializationMultiplier: () => 1,
    systems: {
      prestigeManager: {
        getWorkerCostMultiplier: () => 1,
        getWorkerIntervalMultiplier: () => 1,
        getMultiplier: () => 1,
        getGrainMultiplier: () => 1,
        getChainBonusMultiplier: () => 1,
        getMasteryMultiplier: () => 1,
      },
    },
  });
  const assertPopulationInvariant = (label) => {
    assert.ok(
      state.getTotalWorkers() <= Math.floor(state.getResource("population")),
      `${label}: total workers exceed population`,
    );
  };
  let succeeded = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (wm.hireWorker("gatherer")) succeeded++;
    assertPopulationInvariant(`attempt ${attempt}`);
  }
  assert.ok(succeeded > 0, "expected affordable hires to succeed");
  state.addResource("population", 3);
  for (let attempt = 0; attempt < 40; attempt++) {
    wm.hireWorker("gatherer");
    assertPopulationInvariant(`post-growth attempt ${attempt}`);
  }
  // hires schedule real automation timers; release them so the runner can exit
  wm.resetRunState();
});

// offline harness wiring real WorkerManager + PrestigeManager instances behind
// a mock game-manager facade, following the pattern proven in
// tests/progressionLogic.test.js. inputStock is measured in full-cycle counts.
function offlineHarness(
  eraKey,
  workerId,
  { workerCount = 3, cycleStock = null, durationMs = 65_000 },
) {
  const state = new GameState();
  state.data.currentEra = eraKey;
  state.data.workers = { [workerId]: workerCount };
  state.data.resources = { population: 1 };
  const workerData = config.eraData[eraKey].workers.find(
    (w) => w.id === workerId,
  );
  if (cycleStock !== null) {
    for (const [resource, perCycle] of Object.entries(
      workerData.consumes || {},
    )) {
      state.data.resources[resource] = perCycle * workerCount * cycleStock;
    }
  }
  const persistence = {
    readLastActive: () => String(Date.now() - durationMs),
    writeLastActive: () => {},
  };
  const offline = new OfflineManager(state, persistence);
  const prestige = new PrestigeManager(state);
  const workers = new WorkerManager(state);
  const gameManager = {
    systems: { prestigeManager: prestige, workerManager: workers },
    getCurrentEraData: () => config.eraData[eraKey],
    getPopulationCapacity: (era) => state.getPopulationCapacity(era),
    getPopulationFoodFactor: () => 1,
    getPopulationWorkerLoadFactor: () => 1,
    getSpecializationMultiplier: () => 1,
    getWorkerSpecializationMultiplier: () => 1,
  };
  return { state, offline, gameManager, workerData };
}

const OFFLINE_DURATIONS_MS = [65_000, 3 * 3_600_000, 30 * 3_600_000];

test("offline simulation never yields negative resources for any era, worker, duration, and input state", () => {
  let cases = 0;
  for (const era of config.eraOrder) {
    for (const worker of config.eraData[era].workers || []) {
      if (!worker.consumes) continue;
      for (const cycleStock of [null, 1e7]) {
        for (const durationMs of OFFLINE_DURATIONS_MS) {
          cases++;
          const label = `${era}/${worker.id}/stock=${cycleStock ?? 0}/${durationMs / 3_600_000}h`;
          const { state, offline, gameManager, workerData } = offlineHarness(
            era,
            worker.id,
            { cycleStock, durationMs },
          );

          const result = offline.applyOfflineProduction(gameManager);

          for (const [resource, value] of Object.entries(
            state.data.resources,
          )) {
            assert.ok(
              Number.isFinite(value),
              `${label}: ${resource} became non-finite`,
            );
            assert.ok(
              value >= 0,
              `${label}: ${resource} went negative (${value})`,
            );
          }
          assert.ok(
            Number.isFinite(state.getTotalWorkers()),
            `${label}: worker count non-finite`,
          );

          if (result) {
            assert.ok(
              result.offlineMinutes >= 1,
              `${label}: offline minutes below the floor`,
            );
            for (const [resource, value] of Object.entries(result.produced)) {
              assert.ok(
                Number.isFinite(value) && value >= 0,
                `${label}: reported ${resource}=${value}`,
              );
            }
          }

          if (cycleStock === null) {
            for (const resource of Object.keys(workerData.produces || {})) {
              assert.ok(
                !result || !(resource in result.produced),
                `${label}: produced ${resource} despite having zero inputs`,
              );
            }
          }
        }
      }
    }
  }
  assert.ok(cases > 0, "expected the sweep to cover consuming workers");
});

test("offline chain capping holds for every consuming worker in config", () => {
  const cycleBudget = 37;
  let checked = 0;
  for (const era of config.eraOrder) {
    for (const worker of config.eraData[era].workers || []) {
      if (!worker.consumes) continue;
      checked++;
      const label = `${era}/${worker.id}`;

      // zero inputs: nothing produced, nothing consumed
      {
        const { state, offline, gameManager, workerData } = offlineHarness(
          era,
          worker.id,
          {
            cycleStock: null,
            durationMs: 10 * 3_600_000,
          },
        );
        const result = offline.applyOfflineProduction(gameManager);
        for (const resource of Object.keys(workerData.produces || {})) {
          assert.ok(
            !result || !(resource in result.produced),
            `${label}: produced ${resource} with zero inputs`,
          );
        }
        for (const resource of Object.keys(workerData.consumes || {})) {
          assert.equal(
            state.getResource(resource),
            0,
            `${label}: zero input ${resource} changed`,
          );
        }
      }

      // exactly K cycles of inputs: consumption stays within the stockpile and
      // output stays within what K cycles at configured base rates could yield
      {
        const { state, offline, gameManager, workerData } = offlineHarness(
          era,
          worker.id,
          {
            cycleStock: cycleBudget,
            durationMs: 10 * 3_600_000,
          },
        );
        for (const [input, perCycle] of Object.entries(
          workerData.consumes || {},
        )) {
          state.data.resources[input] = perCycle * 3 * cycleBudget;
        }
        const result = offline.applyOfflineProduction(gameManager);
        for (const [input, perCycle] of Object.entries(
          workerData.consumes || {},
        )) {
          const initial = perCycle * 3 * cycleBudget;
          const finalAmount = state.getResource(input);
          assert.ok(finalAmount >= 0, `${label}: input ${input} went negative`);
          // a worker that also produces its own input may only exceed the
          // stockpile by what it produced; a pure consumer never can
          const selfProduced =
            (workerData.produces?.[input] || 0) > 0
              ? result?.produced[input] || 0
              : 0;
          assert.ok(
            finalAmount <= initial + selfProduced + 1e-9,
            `${label}: ${input} rose above stockpile plus self-production`,
          );
        }
        for (const [output, baseAmount] of Object.entries(
          workerData.produces || {},
        )) {
          const producedTotal = result ? result.produced[output] || 0 : 0;
          const ceiling = baseAmount * 3 * cycleBudget;
          assert.ok(
            producedTotal <= ceiling,
            `${label}: produced ${producedTotal} ${output}, above the ${ceiling} that ${cycleBudget} cycles allow`,
          );
        }
      }
    }
  }
  assert.ok(checked > 0, "expected consuming workers to be swept");
});
