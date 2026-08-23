/**
 * Progression Validator
 *
 * Computes which resources are reachable in each era assuming the player has
 * unlimited time and chooses optimally. If an era's advancement cost demands
 * a resource that is NOT reachable through that era's actions, upgrades, or
 * workers (transitively), the player can softlock.
 *
 * Run at boot. Console-warn on issues. Used during balance development; can
 * also surface a friendly notification in the UI.
 */

import { config } from "../core/config.js";
import { POPULATION_SUPPORT_RESOURCES } from "../core/resourceUtils.js";

// use config.eraOrder for progression validation
const ERA_ORDER = config.eraOrder;

export class ProgressionValidator {
  constructor() {
    this.eraData = config.eraData;
  }

  /**
   * Validate progression for every era. Returns { ok, issues[] }.
   */
  validate() {
    const issues = [];
    // population grows passively in every era — always reachable.
    const reachable = new Set(["population"]);
    const upgrades = new Set();

    for (const [eraIdx, eraId] of ERA_ORDER.entries()) {
      const era = this.eraData?.[eraId];
      if (!era) continue;

      // expand reachability within this era to fixed point
      let changed = true;
      let safety = 0;
      while (changed && safety < 100) {
        changed = false;
        safety++;

        // actions: produce their outputs once their gate is unlocked
        for (const action of era.actions || []) {
          if (action.requiresUpgrade && !upgrades.has(action.requiresUpgrade))
            continue;
          if (action.consumes) {
            const canConsume = Object.keys(action.consumes).every((r) =>
              reachable.has(r),
            );
            if (!canConsume) continue;
          }
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

        // upgrades: unlock when cost and prereq are met
        for (const upgrade of era.upgrades || []) {
          if (upgrades.has(upgrade.id)) continue;
          if (upgrade.requiresUpgrade && !upgrades.has(upgrade.requiresUpgrade))
            continue;
          const cost = upgrade.cost || {};
          if (Object.keys(cost).every((r) => reachable.has(r))) {
            upgrades.add(upgrade.id);
            changed = true;
          }
        }

        // workers: their outputs become reachable when cost + prereq are met
        for (const worker of era.workers || []) {
          if (worker.requiresUpgrade && !upgrades.has(worker.requiresUpgrade))
            continue;
          const cost = worker.cost || {};
          if (!Object.keys(cost).every((r) => reachable.has(r))) continue;
          if (worker.consumes) {
            const canConsume = Object.keys(worker.consumes).every((r) =>
              reachable.has(r),
            );
            if (!canConsume) continue;
          }
          for (const r of Object.keys(worker.produces || {})) {
            if (!reachable.has(r)) {
              reachable.add(r);
              changed = true;
            }
          }
        }
      }

      // check advancement cost for this era is satisfiable
      if (era.advancementCost) {
        const missing = Object.keys(era.advancementCost).filter(
          (r) => !reachable.has(r),
        );
        if (missing.length > 0) {
          issues.push({
            era: eraId,
            kind: "unreachable_advancement_resources",
            resources: missing,
            message: `era '${eraId}' cannot advance: ${missing.join(", ")} not reachable from any action, upgrade, or worker`,
          });
        }
      }

      // check every remaining upgrade of this era is actually purchasable.
      // reachability alone is not enough: a cost resource that only exists as
      // a one-time starter-pack grant can strand an upgrade forever.
      for (const upgrade of era.upgrades || []) {
        if (upgrades.has(upgrade.id)) continue;
        const missing = Object.keys(upgrade.cost || {}).filter(
          (r) => !reachable.has(r),
        );
        if (missing.length > 0) {
          issues.push({
            era: eraId,
            kind: "unpurchasable_upgrade",
            upgrade: upgrade.id,
            resources: missing,
            message: `era '${eraId}' upgrade '${upgrade.id}' can never be purchased: ${missing.join(", ")} has no producer reachable in this era`,
          });
        }
      }

      // ongoing-production set: what the era keeps producing while played.
      // workers whose input resources are absent from it idle forever once
      // carry-over stockpiles run dry (releaseWorkersOutsideEra deletes the
      // prior-era producers on advance).
      const ongoing = new Set(POPULATION_SUPPORT_RESOURCES[eraId] || []);
      for (const action of era.actions || []) {
        if (action.requiresUpgrade && !upgrades.has(action.requiresUpgrade))
          continue;
        for (const r of Object.keys(action.produces || {})) ongoing.add(r);
        for (const r of Object.keys(action.bonusChance || {})) ongoing.add(r);
      }
      for (const worker of era.workers || []) {
        if (worker.requiresUpgrade && !upgrades.has(worker.requiresUpgrade))
          continue;
        if (!Object.keys(worker.cost || {}).every((r) => reachable.has(r)))
          continue;
        for (const r of Object.keys(worker.produces || {})) ongoing.add(r);
      }
      for (const route of Object.values(config.tradeRoutes || {})) {
        const unlockIdx = ERA_ORDER.indexOf(route?.unlockEra);
        if (unlockIdx === -1 || unlockIdx > eraIdx) continue;
        for (const r of Object.keys(route.produces || {})) ongoing.add(r);
      }
      for (const ev of config.events?.[eraId] || []) {
        for (const [r, amount] of Object.entries(ev?.effect || {})) {
          if (amount > 0) ongoing.add(r);
        }
      }

      for (const worker of era.workers || []) {
        if (!worker.consumes) continue;
        if (worker.requiresUpgrade && !upgrades.has(worker.requiresUpgrade))
          continue;
        if (!Object.keys(worker.cost || {}).every((r) => reachable.has(r)))
          continue;
        const missing = Object.keys(worker.consumes).filter(
          (r) => !ongoing.has(r),
        );
        if (missing.length > 0) {
          issues.push({
            era: eraId,
            kind: "worker_inputs_not_ongoing",
            worker: worker.id,
            resources: missing,
            message: `era '${eraId}' worker '${worker.id}' consumes ${missing.join(", ")} which its own era cannot produce; fleet starves of inputs after advancing`,
          });
        }
      }
    }

    return { ok: issues.length === 0, issues };
  }

  /**
   * Run validation and emit warnings to the console.
   */
  runAndReport() {
    const result = this.validate();
    if (result.ok) {
      console.info("[progression] all eras pass reachability check");
    } else {
      console.warn("[progression] softlock risks detected:");
      result.issues.forEach((i) => console.warn(" -", i.message));
    }
    return result;
  }
}
