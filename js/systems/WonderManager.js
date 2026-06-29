/**
 * WonderManager - Manages wonder construction and bonuses
 * Wonders are one-time constructions that provide permanent bonuses
 * Only one wonder can be built per era
 */

import { config } from "../core/config.js";
import { getEraIndex, isEraUnlocked } from "../core/resourceUtils.js";

export class WonderManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.gameManager = null;
  }

  setGameManager(gm) {
    this.gameManager = gm;
  }

  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  /**
   * Initialize wonders from saved state
   */
  initialize() {
    if (!this.gameState.data.wonders) {
      this.gameState.data.wonders = { built: [] };
    }
  }

  /**
   * Check if a wonder can be built
   */
  canBuildWonder(wonderId) {
    const wonder = config.wonders[wonderId];
    if (!wonder) return { canBuild: false, reason: "Wonder not found" };

    // check if already built
    const builtWonders = this.gameState.data.wonders?.built || [];
    if (builtWonders.includes(wonderId)) {
      return { canBuild: false, reason: "Already built" };
    }

    // check if another wonder from same era is built
    const eraWonders = builtWonders.filter((wid) => {
      const w = config.wonders[wid];
      return w && w.era === wonder.era;
    });
    if (eraWonders.length > 0) {
      return { canBuild: false, reason: "Already built a wonder this era" };
    }

    // check era requirement
    const currentEra = this.gameState.data.currentEra;
    if (!isEraUnlocked(currentEra, wonder.era)) {
      return {
        canBuild: false,
        reason: `Requires ${config.eras[wonder.era]?.name || wonder.era}`,
      };
    }

    // check civilization requirement (if any)
    if (wonder.civilization) {
      const civSpecs = this.gameState.data.civSpecializations || {};
      const hasCiv = Object.values(civSpecs).includes(wonder.civilization);
      if (!hasCiv) {
        const civSpec = this.getCivSpecDetails(wonder.civilization);
        return {
          canBuild: false,
          reason: `Requires ${civSpec?.name || wonder.civilization} civilization`,
        };
      }
    }

    // check cost
    if (!this.gameState.canAfford(wonder.cost)) {
      return { canBuild: false, reason: "Cannot afford" };
    }

    return { canBuild: true };
  }

  /**
   * Get civilization specialization details by id
   */
  getCivSpecDetails(civId) {
    for (const era of Object.keys(config.civSpecializations || {})) {
      const spec = config.civSpecializations[era].find((s) => s.id === civId);
      if (spec) return spec;
    }
    return null;
  }

  /**
   * Build a wonder
   */
  buildWonder(wonderId) {
    const { canBuild, reason } = this.canBuildWonder(wonderId);
    if (!canBuild) {
      this.gameManager?.showNotification(reason, "error");
      return false;
    }

    const wonder = config.wonders[wonderId];

    // spend cost
    this.gameState.spendResources(wonder.cost);

    // add to built wonders
    if (!this.gameState.data.wonders) {
      this.gameState.data.wonders = { built: [] };
    }
    this.gameState.data.wonders.built.push(wonderId);

    // notify
    this.gameManager?.showNotification(
      `Built ${wonder.name}! ${wonder.description}`,
      "success",
      6000
    );
    this.gameManager?.logGameEvent?.({
      name: `Wonder Built: ${wonder.name}`,
      description: wonder.description,
    });

    // emit event for store sync
    this.gameState.notifyListeners("wonderBuilt", { wonderId, wonder });

    return true;
  }

  /**
   * Get bonus multiplier for a resource from all built wonders
   */
  getWonderMultiplier(resource) {
    let multiplier = 1.0;

    const builtWonders = this.gameState.data.wonders?.built || [];
    builtWonders.forEach((wonderId) => {
      const wonder = config.wonders[wonderId];
      if (wonder?.bonuses?.[resource]) {
        multiplier *= wonder.bonuses[resource];
      }
    });

    return multiplier;
  }

  /**
   * Check if a wonder is built
   */
  isWonderBuilt(wonderId) {
    return this.gameState.data.wonders?.built?.includes(wonderId) || false;
  }

  /**
   * Get list of buildable wonders for current era and civilization
   */
  getAvailableWonders() {
    const available = [];
    const currentEra = this.gameState.data.currentEra;
    const eraOrder = config.eraOrder;
    const currentEraIdx = getEraIndex(currentEra);
    const civSpecs = this.gameState.data.civSpecializations || {};

    Object.entries(config.wonders).forEach(([wonderId, wonder]) => {
      const requiredEraIdx = getEraIndex(wonder.era);

      // show wonders from current and past eras
      if (currentEraIdx >= requiredEraIdx) {
        const { canBuild, reason } = this.canBuildWonder(wonderId);

        // filter by civilization if required
        let civMatch = true;
        if (wonder.civilization) {
          civMatch = Object.values(civSpecs).includes(wonder.civilization);
        }

        // show if either no civ required, or civ matches, or already built
        if (!wonder.civilization || civMatch || this.isWonderBuilt(wonderId)) {
          available.push({
            ...wonder,
            id: wonderId,
            canBuild,
            reason: canBuild ? null : reason,
            isBuilt: this.isWonderBuilt(wonderId),
          });
        }
      }
    });

    // sort by era order
    available.sort((a, b) => {
      return getEraIndex(a.era) - getEraIndex(b.era);
    });

    return available;
  }

  /**
   * Get all built wonders with their details
   */
  getBuiltWonders() {
    const builtWonders = this.gameState.data.wonders?.built || [];
    return builtWonders.map((wonderId) => ({
      id: wonderId,
      ...config.wonders[wonderId],
    }));
  }

  /**
   * Get wonders available for a specific era
   */
  getWondersForEra(era) {
    return Object.entries(config.wonders)
      .filter(([_, wonder]) => wonder.era === era)
      .map(([id, wonder]) => ({
        ...wonder,
        id,
        isBuilt: this.isWonderBuilt(id),
        canBuild: this.canBuildWonder(id).canBuild,
      }));
  }

  /**
   * Check if any wonder has been built in an era
   */
  hasWonderInEra(era) {
    const builtWonders = this.gameState.data.wonders?.built || [];
    return builtWonders.some((wid) => {
      const wonder = config.wonders[wid];
      return wonder && wonder.era === era;
    });
  }

  /**
   * Reset wonders (wonders persist through prestige by default, but can be reset)
   * Note: Typically wonders should NOT reset on prestige - they're permanent achievements
   */
  reset(includeWonders = false) {
    if (includeWonders) {
      this.gameState.data.wonders = { built: [] };
    }
  }
}
