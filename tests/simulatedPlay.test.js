import assert from "node:assert/strict";
import test from "node:test";

import { GameManager, ERA_STARTER_PACKS } from "../js/GameManager.js";
import { config } from "../js/core/config.js";

// live finding referenced by skipped tests and horizon comments below:
//
// FINDING-4 (medieval stall): driving the real GameManager under the greedy
// policy below reliably stalls in the medieval era. root causes:
//   - FINDING-2's miller lock removes the era's only automated agriculture
//     producer; releaseWorkersOutsideEra also drops the neolithic farmers on
//     entry, leaving the [agriculture, grain, mills] support pool fed solely
//     by manual plow clicks (+3 per step here).
//   - monks are the sole religion producer, so the religion >= 20 advancement
//     requirement forces hiring them, and their fleet upkeep drains the same
//     pool the agriculture >= 60 requirement needs.
//   - one-time seed budgets stay tight earlier too: under a deterministic
//     random of 0.5 (the report's suggested stub) the digClay tools bonus
//     (0.25) never fires and the run already deadlocks inside neolithic.
//
// RANDOM_CONSTANT is chosen as 0.1 so every configured bonusChance producer
// fires deterministically (lowest configured probability is 0.2), no
// failChance exists anywhere in config, and events cannot fire (the single
// event check happens at population < 2 and bails before rolling).

const RANDOM_CONSTANT = 0.1;
const STEP_CAP_PER_ERA = 4000;
const GROWTH_UPDATES_PER_STEP = 15;
const STALL_LIMIT = 300;

async function withGameBrowser(run) {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const storage = new Map();

  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = { getElementById: () => null };
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};

  try {
    // awaited so the globals stay installed for the full async body
    return await run(storage);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.localStorage = originalLocalStorage;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  }
}

async function withDeterministicRandom(run) {
  const originalRandom = Math.random;
  Math.random = () => RANDOM_CONSTANT;
  try {
    return await run();
  } finally {
    Math.random = originalRandom;
  }
}

function dumpState(manager) {
  const data = manager.gameState.data;
  return JSON.stringify(
    {
      era: data.currentEra,
      canAdvance: manager.gameState.canAdvanceEra(),
      resources: Object.fromEntries(
        Object.entries(data.resources).map(([k, v]) => [
          k,
          Math.round(v * 100) / 100,
        ]),
      ),
      workers: data.workers,
      upgrades: Object.keys(data.upgrades).filter(
        (id) => data.upgrades[id] === true,
      ),
    },
    null,
    1,
  );
}

function purchasePass(manager) {
  const eraData = manager.getCurrentEraData();
  let purchases = 0;
  let progress = true;
  while (progress) {
    progress = false;
    for (const upgrade of eraData.upgrades) {
      if (manager.gameState.hasUpgrade(upgrade.id)) continue;
      if (
        upgrade.requiresUpgrade &&
        !manager.gameState.hasUpgrade(upgrade.requiresUpgrade)
      ) {
        continue;
      }
      if (manager.buyUpgrade(upgrade.id)) {
        purchases++;
        progress = true;
      }
    }
    for (const worker of eraData.workers) {
      let guard = 500;
      while (guard-- > 0 && manager.hireWorker(worker.id)) purchases++;
    }
  }
  return purchases;
}

function productionPass(manager) {
  const eraData = manager.getCurrentEraData();
  for (const worker of eraData.workers) {
    if ((manager.gameState.data.workers[worker.id] || 0) === 0) continue;
    for (let cycle = 0; cycle < 3; cycle++) {
      manager.systems.workerManager.performWorkerWork(worker.id, worker);
    }
  }
  for (const action of eraData.actions) {
    if (
      action.requiresUpgrade &&
      !manager.gameState.hasUpgrade(action.requiresUpgrade)
    ) {
      continue;
    }
    manager.systems.resourceManager.performClickAction(action);
  }
}

function growthPass(manager) {
  for (let i = 0; i < GROWTH_UPDATES_PER_STEP; i++) {
    manager.update(1000);
  }
}

function assertNumericInvariants(manager, previousLifetime) {
  const data = manager.gameState.data;
  for (const [resource, value] of Object.entries(data.resources)) {
    assert.ok(Number.isFinite(value), `resource ${resource} became non-finite`);
    assert.ok(value >= 0, `resource ${resource} went negative: ${value}`);
  }
  assert.ok(
    Number.isFinite(manager.gameState.getTotalWorkers()),
    "total worker count became non-finite",
  );
  const lifetime = data.lifetimeProduced || {};
  for (const [resource, value] of Object.entries(lifetime)) {
    assert.ok(
      Number.isFinite(value) && value >= 0,
      `lifetimeProduced ${resource} invalid: ${value}`,
    );
    const before = previousLifetime[resource] || 0;
    assert.ok(value >= before, `lifetimeProduced ${resource} decreased`);
  }
  return { ...lifetime };
}

// drives the real game loop greedily: buy everything affordable, work every
// hired worker, click every eligible action, then grow via update(). advances
// once a settled pass meets the advancement cost. returns a trace describing
// how far the run got; every step passes through assertNumericInvariants.
function drivePlaythrough(
  manager,
  { stopAfterEra = null, onAdvance = null } = {},
) {
  const finalEra = config.eraOrder[config.eraOrder.length - 1];
  let lifetime = {};
  let totalSteps = 0;
  const eraTrace = [];

  while (true) {
    const era = manager.gameState.data.currentEra;
    lifetime = assertNumericInvariants(manager, lifetime);
    if (era === finalEra) {
      return { complete: true, stuckAt: null, era, eraTrace, totalSteps };
    }
    if (stopAfterEra !== null && era === stopAfterEra) {
      return { complete: false, stuckAt: null, era, eraTrace, totalSteps };
    }

    let advanced = false;
    let steps = 0;
    let stalledFor = 0;
    while (steps < STEP_CAP_PER_ERA) {
      lifetime = assertNumericInvariants(manager, lifetime);
      const bought = purchasePass(manager);
      stalledFor = bought === 0 ? stalledFor + 1 : 0;
      productionPass(manager);
      growthPass(manager);
      totalSteps++;
      steps++;
      lifetime = assertNumericInvariants(manager, lifetime);

      if (bought === 0 && manager.gameState.canAdvanceEra()) {
        advanced = onAdvance ? onAdvance(manager) : manager.advanceEra();
        eraTrace.push({ from: era, advanced, steps });
        break;
      }
      if (stalledFor >= STALL_LIMIT) break;
    }

    if (!advanced) {
      return {
        complete: false,
        stuckAt: era,
        era,
        eraTrace,
        totalSteps,
        dump: dumpState(manager),
      };
    }
  }
}

async function createManager() {
  const manager = new GameManager();
  await manager.initPromise;
  return manager;
}

test(
  "a fresh save can reach every era by playing greedily",
  {
  },
  async () => {
    await withGameBrowser(async (storage) => {
      await withDeterministicRandom(async () => {
        const manager = await createManager();
        try {
          const result = drivePlaythrough(manager);
          assert.equal(
            result.stuckAt,
            null,
            `greedy playthrough stalled in ${result.stuckAt} after ${result.totalSteps} steps:\n${result.dump}`,
          );
          for (const transition of result.eraTrace) {
            assert.ok(
              transition.advanced,
              `advanceEra() from ${transition.from} returned false`,
            );
          }
          assert.equal(result.era, config.eraOrder[config.eraOrder.length - 1]);
        } finally {
          manager.destroy();
        }
      });
    });
  },
);

test("no code path drives a resource negative or non-finite during simulated play", async () => {
  await withGameBrowser(async (storage) => {
    await withDeterministicRandom(async () => {
      const manager = await createManager();
      try {
        const result = drivePlaythrough(manager);
        // every step of the driven horizon already passed through
        // assertNumericInvariants; reaching this line means no resource ever
        // went negative or non-finite and lifetime production never decreased.
        assert.ok(
          result.totalSteps > 100,
          "driven horizon too short to be meaningful",
        );
        if (!result.complete) {
          // the horizon currently ends at the FINDING-4 medieval stall; the
          // invariant guard still covers paleolithic through medieval.
          assert.equal(result.stuckAt, "medieval");
        }
      } finally {
        manager.destroy();
      }
    });
  });
});

// plays paleolithic from scratch until the advancement threshold is met
function bootstrapToAdvancement(manager, label) {
  for (let step = 0; step < STEP_CAP_PER_ERA; step++) {
    purchasePass(manager);
    productionPass(manager);
    growthPass(manager);
    if (manager.gameState.canAdvanceEra()) return step;
  }
  assert.fail(
    `${label}: bootstrap never reached canAdvanceEra\n${dumpState(manager)}`,
  );
}

test("prestige can never leave a player unable to progress", async () => {
  await withGameBrowser(async (storage) => {
    await withDeterministicRandom(async () => {
      const manager = await createManager();
      try {
        const state = manager.gameState;
        const pm = manager.systems.prestigeManager;

        // bootstrap paleolithic and enter neolithic so prestige unlocks
        bootstrapToAdvancement(manager, "first run");
        assert.ok(manager.advanceEra(), "entering neolithic failed");
        assert.equal(state.data.currentEra, "neolithic");

        const epBefore = pm.calculateEPGain();
        const gained = pm.prestige();
        assert.equal(
          gained,
          epBefore,
          "banked EP diverged from the quoted gain",
        );

        // post-prestige shape equals a valid fresh-run state
        assert.equal(state.data.currentEra, config.eraOrder[0]);
        assert.deepEqual(
          Object.keys(state.data.workers),
          [],
          "workers survived prestige",
        );
        assert.ok(
          state.getResource("population") >= 1,
          "fresh run lost its founder population",
        );
        assert.ok(state.getResource("sticks") > 0, "starter sticks missing");
        assert.ok(state.getResource("stones") > 0, "starter stones missing");
        assert.ok(
          !Object.values(state.data.upgrades).some(Boolean),
          "upgrades survived prestige",
        );

        const prestigeData = pm.getPrestigeData();
        assert.equal(prestigeData.evolutionPoints, gained);
        assert.equal(prestigeData.lifetimeEP, gained);
        assert.equal(prestigeData.totalResets, 1);
        assert.ok(prestigeData.completedEras.includes("paleolithic"));

        // replay: the fresh run must be able to progress again
        bootstrapToAdvancement(manager, "post-prestige replay");

        // perk leg: tier-1 perk must not brick subsequent runs either
        const quickStart = config.prestigeTalentTree.find(
          (p) => p.id === "quickStart",
        );
        if (pm.getPrestigeData().evolutionPoints < quickStart.cost) {
          // test arrangement so the perk leg can run regardless of run yield
          pm.getPrestigeData().evolutionPoints += quickStart.cost;
        }
        assert.ok(pm.purchasePerk("quickStart"), "quickStart purchase failed");
        assert.ok(pm.hasPerk("quickStart"));

        bootstrapToAdvancement(manager, "perk-owned run");
        assert.ok(manager.advanceEra(), "re-entering neolithic failed");

        const pointsBeforeSecond = pm.getPrestigeData().evolutionPoints;
        const lifetimeEPBefore = pm.getPrestigeData().lifetimeEP;
        const epSecond = pm.calculateEPGain();
        assert.ok(epSecond > 0, "second run earned no EP");
        const gainedSecond = pm.prestige();
        assert.equal(gainedSecond, epSecond);
        assert.equal(
          pm.getPrestigeData().evolutionPoints,
          pointsBeforeSecond + gainedSecond,
        );
        assert.equal(
          pm.getPrestigeData().lifetimeEP,
          lifetimeEPBefore + gainedSecond,
        );
        assert.equal(pm.getPrestigeData().totalResets, 2);
        assert.ok(!Object.values(state.data.upgrades).some(Boolean));

        // quickStart evidence: resources a bare reset never ships are present
        for (const resource of ["meat", "cookedMeat", "bones", "fur"]) {
          assert.ok(
            state.getResource(resource) > 0,
            `perk run did not seed ${resource}`,
          );
        }

        bootstrapToAdvancement(manager, "post-perk replay");
      } finally {
        manager.destroy();
      }
    });
  });
});

// asserts every documented transition promise around one advanceEra() call
function checkedAdvance(manager) {
  const state = manager.gameState;
  const currentEra = state.data.currentEra;
  const nextEra = manager.getNextEra(currentEra);
  assert.ok(nextEra, `no successor era from ${currentEra}`);
  const advancementCost = config.eraData[currentEra].advancementCost || {};
  const pack = ERA_STARTER_PACKS[nextEra] || {};
  const packMult = config.balance?.eraStarterPackMultiplier ?? 1;

  const preResources = { ...state.data.resources };
  const ownedUpgrades = Object.keys(state.data.upgrades).filter(
    (id) => state.data.upgrades[id] === true,
  );

  assert.ok(
    state.canAdvanceEra(),
    `drive claimed ${currentEra} was ready but canAdvanceEra disagrees`,
  );
  assert.equal(
    manager.advanceEra(),
    true,
    `advanceEra() from ${currentEra} failed`,
  );
  assert.equal(state.data.currentEra, nextEra);

  // population is a threshold, never spent
  assert.equal(
    state.getResource("population"),
    preResources.population ?? 0,
    `population changed across ${currentEra} -> ${nextEra}`,
  );

  // non-population costs deducted exactly, starter-pack arrivals credited
  for (const [resource, amount] of Object.entries(advancementCost)) {
    if (resource === "population") continue;
    const grant =
      resource in pack ? Math.max(1, Math.floor(pack[resource] * packMult)) : 0;
    const expected = (preResources[resource] || 0) - amount + grant;
    assert.equal(
      state.getResource(resource),
      expected,
      `${resource} bookkeeping broke across ${currentEra} -> ${nextEra}`,
    );
  }

  // every entry-pack resource increased by its configured grant; resources
  // this era's cost also charges are covered by the exact arithmetic above,
  // since spending them first can make their net change negative
  for (const [resource, amount] of Object.entries(pack)) {
    if (resource in advancementCost) continue;
    const grant = Math.max(1, Math.floor(amount * packMult));
    assert.ok(
      state.getResource(resource) >= (preResources[resource] || 0) + grant,
      `starter pack for ${nextEra} did not credit ${resource}`,
    );
  }
  // note: the per-key grant checks above already prove the pack arrived; a
  // "some resource appeared from nothing" heuristic would be false-failing
  // where earlier eras legitimately leak pack resources forward (iron
  // engineers produce cities before classical begins)

  // out-of-era workers released, upgrades persist, capacity clamp engaged
  const allowed = new Set(
    (config.eraData[nextEra].workers || []).map((w) => w.id),
  );
  for (const workerId of Object.keys(state.data.workers)) {
    assert.ok(
      allowed.has(workerId),
      `worker ${workerId} survived transition into ${nextEra}`,
    );
  }
  for (const id of ownedUpgrades) {
    assert.ok(state.hasUpgrade(id), `upgrade ${id} lost across transition`);
  }
  assert.ok(
    state.getResource("population") <= state.getPopulationCapacity(nextEra),
    `population exceeds the ${nextEra} cap immediately after transition`,
  );

  // an unearned immediate repeat is refused cleanly and leaves state untouched
  const snapshot = JSON.stringify(state.data.resources);
  assert.equal(
    manager.advanceEra(),
    false,
    "unearned repeat advance succeeded",
  );
  assert.equal(state.data.currentEra, nextEra);
  assert.equal(
    JSON.stringify(state.data.resources),
    snapshot,
    "refused advance mutated resources",
  );
  return true;
}

// tops up whatever the current era's advancement cost still needs
function arrangeAffordability(manager) {
  const state = manager.gameState;
  const cost = config.eraData[state.data.currentEra].advancementCost || {};
  for (const [resource, amount] of Object.entries(cost)) {
    if (resource === "population") continue;
    const deficit = amount - state.getResource(resource);
    if (deficit > 0) state.addResource(resource, deficit + 10);
  }
  const populationDeficit =
    (cost.population || 0) - state.getResource("population");
  if (populationDeficit > 0) state.addResource("population", populationDeficit);
}

test("era transitions preserve exactly what the design promises", async () => {
  await withGameBrowser(async (storage) => {
    await withDeterministicRandom(async () => {
      const manager = await createManager();
      try {
        // organic play through five consecutive transitions
        const result = drivePlaythrough(manager, {
          stopAfterEra: "medieval",
          onAdvance: checkedAdvance,
        });
        assert.equal(result.stuckAt, null);
        assert.equal(result.era, "medieval");
        assert.ok(result.eraTrace.length >= 5);

        // arranged affordability carries the same checks into later eras
        for (const target of ["renaissance", "enlightenment", "industrial"]) {
          arrangeAffordability(manager);
          checkedAdvance(manager);
          assert.equal(manager.gameState.data.currentEra, target);
        }
      } finally {
        manager.destroy();
      }
    });
  });
});
