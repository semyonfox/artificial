/**
 * Game Manager - Main game coordination system
 * Handles game logic, progression, and system coordination
 */

import { GameState } from "./core/GameState.js";
import { BrowserSaveAdapter } from "./core/BrowserSaveAdapter.js";
import { ResourceManager } from "./systems/ResourceManager.js";
import { WorkerManager } from "./systems/WorkerManager.js";
import { EventManager } from "./systems/EventManager.js";
import { OfflineManager } from "./systems/OfflineManager.js";
import { AchievementManager } from "./systems/AchievementManager.js";
import { PrestigeManager } from "./systems/PrestigeManager.js";
import { ProgressionValidator } from "./systems/ProgressionValidator.js";
import { TradeRouteManager } from "./systems/TradeRouteManager.js";
import { WonderManager } from "./systems/WonderManager.js";
import { config } from "./core/config.js";
import { formatResourceList, getEraIndex, scaleCost } from "./core/resourceUtils.js";

const POPULATION_SUPPORT_RESOURCES = {
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

export class GameManager {
  constructor(persistence = new BrowserSaveAdapter()) {
    this.persistence = persistence;
    this.initialized = false;
    this.systems = {};
    this.gameLoopId = null;
    this.lastUpdateTime = performance.now();
    this.gameState = null;

    // periodic task accumulators (ms)
    this.eraCheckAccum = 0;
    this.validateAccum = 0;

    // track if we've already notified about era advancement opportunity
    this.eraAdvanceNotified = false;

    // store reference for notifications (set by gameStore.initialize)
    this.store = null;
    this.pendingNotifications = [];
    this.pendingLogEntries = [];

    // Cooldowns are game rules, not a presentation concern. Keeping them here
    // makes click actions behave the same through every UI surface.
    this.actionCooldowns = new Map();
    this.actionCooldownTimers = new Map();

    this.initPromise = this.initialize();
  }

  /**
   * Initialize the game systems in proper order
   */
  async initialize() {
    try {
      // boot-time softlock check (dev safety; never blocks startup)
      try {
        new ProgressionValidator().runAndReport();
      } catch (e) {
        console.warn('progression validator threw:', e);
      }

      // Create game state first
      this.gameState = new GameState(this.persistence);

      // Try to load saved game
      this.gameState.load();

      // Initialize systems in dependency order
      this.initializeSystems();

      // Connect system dependencies
      this.connectSystems();

      // Set up event listeners
      this.setupEventListeners();

      // Start game loop
      this.startGameLoop();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Apply offline production
      const offlineResult =
        this.systems.offlineManager.applyOfflineProduction(this);
      if (offlineResult) {
        const resourceText = formatResourceList(offlineResult.produced);
        this.showNotification(
          `Welcome back! (${offlineResult.offlineMinutes}m away) Workers produced: ${resourceText}`,
          "success",
          6000,
        );
      }

      // Loading restores worker counts, not their runtime timers. Resume them
      // after offline production so returning players do not end up with a
      // valid-looking save whose automation is permanently stopped.
      this.restartWorkerAutomation();

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize game:", error);
      throw error;
    }
  }

  /**
   * Initialize all game systems
   */
  initializeSystems() {
    // Initialize systems that don't depend on others first
    this.systems.resourceManager = new ResourceManager(this.gameState);
    this.systems.workerManager = new WorkerManager(this.gameState);
    this.systems.eventManager = new EventManager(this.gameState);

    this.systems.offlineManager = new OfflineManager(this.gameState, this.persistence);
    this.systems.achievementManager = new AchievementManager(this.gameState);
    this.systems.prestigeManager = new PrestigeManager(this.gameState);

    // Trade routes and wonders
    this.systems.tradeRouteManager = new TradeRouteManager(this.gameState);
    this.systems.wonderManager = new WonderManager(this.gameState);
  }

  /**
   * Connect systems that need references to each other
   */
  connectSystems() {
    // Connect managers to game manager for era data / prestige / notifications
    this.systems.workerManager.setGameManager(this);
    this.systems.resourceManager.setGameManager(this);
    this.systems.eventManager.setGameManager(this);
    this.systems.achievementManager.setGameManager(this);
    this.systems.tradeRouteManager.setGameManager(this);
    this.systems.wonderManager.setGameManager(this);

    // Initialize new systems
    this.systems.tradeRouteManager.initialize();
    this.systems.wonderManager.initialize();
  }

  /**
   * Set the Svelte store reference for notifications
   */
  setStore(store) {
    this.store = store;
    this.flushPendingPresentation();
  }

  flushPendingPresentation() {
    if (!this.store) return;

    const notifications = this.pendingNotifications.splice(0);
    notifications.forEach(({ message, type, duration }) => {
      this.store.showNotification(message, type, duration);
    });

    const logEntries = this.pendingLogEntries.splice(0);
    logEntries.forEach(({ event, isDisaster }) => {
      if (isDisaster) {
        this.store.logDisaster(event);
      } else {
        this.store.logEvent(event);
      }
    });
  }

  /**
   * Show a notification through the active presentation adapter.
   */
  showNotification(message, type = 'success', duration = 2000) {
    if (this.store) {
      this.store.showNotification(message, type, duration);
    } else {
      this.pendingNotifications.push({ message, type, duration });
    }
  }

  /**
   * Add important run milestones to the event log.
   */
  logGameEvent(event) {
    if (this.store) {
      this.store.logEvent(event);
    } else {
      this.pendingLogEntries.push({ event, isDisaster: false });
    }
  }

  /**
   * Add a disaster to the active presentation surface, or keep it until one
   * attaches during boot.
   */
  logGameDisaster(event) {
    if (this.store) {
      this.store.logDisaster(event);
    } else {
      this.pendingLogEntries.push({ event, isDisaster: true });
    }
  }

  /**
   * Set up event listeners for cross-system communication
   */
  setupEventListeners() {
    // Listen for upgrade unlocks
    this.gameState.addListener("upgradeUnlocked", (data) => {
      this.showNotification(
        `Unlocked: ${data.upgradeId}`,
        "success",
      );
    });

    this.gameState.addListener("progressionChange", () => {
      this.systems.achievementManager?.checkAchievements();
    });

    // Auto-save every interval
    this.autoSaveInterval = setInterval(() => {
      if (this.gameState && this.gameState.data.settings.autoSave) {
        this.gameState.save();
      }
    }, config.storage.autoSaveInterval);
  }

  /**
   * Start the main game loop
   */
  startGameLoop() {
    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;

      this.update(deltaTime);
      this.gameLoopId = requestAnimationFrame(gameLoop);
    };

    this.gameLoopId = requestAnimationFrame(gameLoop);
  }

  /**
   * Main game update loop
   */
  update(deltaTime) {
    if (!this.initialized) return;

    // Update performance stats
    if (this.performanceStats) {
      this.performanceStats.frameCount++;
      this.performanceStats.totalFrameTime += deltaTime;
    }

    // Update total play time
    this.gameState.data.totalPlayTime += deltaTime;

    // Update all systems
    if (this.systems.eventManager) {
      this.systems.eventManager.update(this.lastUpdateTime);
    }

    if (this.systems.achievementManager) {
      this.systems.achievementManager.update(deltaTime);
    }

    // Check for era advancement (every 10 seconds)
    this.eraCheckAccum += deltaTime;
    if (this.eraCheckAccum >= 10000) {
      this.eraCheckAccum -= 10000;
      this.checkEraAdvancement();
    }

    // Validate game state periodically (every 5 seconds)
    this.validateAccum += deltaTime;
    if (this.validateAccum >= 5000) {
      this.validateAccum -= 5000;
      this.gameState.validate();
    }

    // Update population growth
    this.updatePopulationGrowth(deltaTime);
  }

  /**
   * Perform a config-driven click action
   */
  doClickAction(action) {
    if (!action || this.isActionOnCooldown(action.id)) return null;

    const result = this.systems.resourceManager.performClickAction(action);
    if (result) {
      if (!result.failed) {
        this.recordManualAction(1);
      }
      this.startActionCooldown(action);
    }
    return result;
  }

  getCurrentActionViews() {
    const actions = this.getCurrentEraData()?.actions || [];
    return actions
      .filter((action) => !action.requiresUpgrade || this.gameState.hasUpgrade(action.requiresUpgrade))
      .map((action) => {
        const cooldownRemaining = this.getActionCooldownRemaining(action.id);
        return {
          ...action,
          canAfford: !action.consumes || this.gameState.canAfford(action.consumes),
          cooldownMs: action.cooldown || 1000,
          cooldownRemaining,
          isOnCooldown: cooldownRemaining > 0,
        };
      });
  }

  getActionCooldownRemaining(actionId) {
    const expiresAt = this.actionCooldowns.get(actionId);
    if (!expiresAt) return 0;

    const remaining = Math.max(0, expiresAt - Date.now());
    if (remaining === 0) {
      this.actionCooldowns.delete(actionId);
      this.clearActionCooldownTimer(actionId);
    }
    return remaining;
  }

  isActionOnCooldown(actionId) {
    return this.getActionCooldownRemaining(actionId) > 0;
  }

  startActionCooldown(action) {
    const cooldownMs = action.cooldown || 1000;
    if (!action.id || cooldownMs <= 0) return;

    const expiresAt = Date.now() + cooldownMs;
    this.actionCooldowns.set(action.id, expiresAt);
    this.clearActionCooldownTimer(action.id);
    this.actionCooldownTimers.set(action.id, setTimeout(() => {
      if (this.actionCooldowns.get(action.id) !== expiresAt) return;
      this.actionCooldowns.delete(action.id);
      this.actionCooldownTimers.delete(action.id);
      this.gameState?.notifyListeners("actionCooldownChange", { actionId: action.id });
    }, cooldownMs));
    this.gameState?.notifyListeners("actionCooldownChange", { actionId: action.id });
  }

  clearActionCooldownTimer(actionId) {
    const timer = this.actionCooldownTimers.get(actionId);
    if (timer) clearTimeout(timer);
    this.actionCooldownTimers.delete(actionId);
  }

  clearActionCooldowns() {
    this.actionCooldownTimers.forEach((timer) => clearTimeout(timer));
    this.actionCooldownTimers.clear();
    this.actionCooldowns.clear();
  }

  /**
   * Hire a worker
   */
  hireWorker(workerType) {
    return this.systems.workerManager.hireWorker(workerType);
  }

  /**
   * Buy an upgrade (applies prestige cost discount)
   */
  buyUpgrade(upgradeId) {
    const currentEraData = this.getCurrentEraData();
    const upgrade = currentEraData.upgrades.find((u) => u.id === upgradeId);

    if (!upgrade) {
      this.showNotification("Upgrade not found", "error");
      return false;
    }

    if (this.gameState.hasUpgrade(upgradeId)) {
      this.showNotification(
        "Upgrade already purchased",
        "info",
      );
      return false;
    }

    if (
      upgrade.requiresUpgrade &&
      !this.gameState.hasUpgrade(upgrade.requiresUpgrade)
    ) {
      this.showNotification(
        `Requires ${upgrade.requiresUpgrade} first`,
        "error",
      );
      return false;
    }

    // Apply prestige cost discount
    const costMult = (this.systems.prestigeManager?.getUpgradeCostMultiplier() || 1)
      * (config.balance?.upgradeCostMultiplier || 1);
    const adjustedCost = scaleCost(upgrade.cost, costMult);

    if (!this.gameState.canAfford(adjustedCost)) {
      this.showNotification("Cannot afford upgrade", "error");
      return false;
    }

    if (this.gameState.spendResources(adjustedCost)) {
      this.gameState.unlockUpgrade(upgradeId);
      this.applyUpgradeEffect(upgrade);
      this.showNotification(
        `Purchased ${upgrade.name}!`,
        "success",
      );
      return true;
    }

    return false;
  }

  /**
   * Choose an era specialization (mutually exclusive)
   */
  chooseSpecialization(eraKey, specId) {
    const specs = config.eraSpecializations[eraKey];
    if (!specs) return false;

    const spec = specs.find(s => s.id === specId);
    if (!spec) return false;

    // initialize specialization tracking
    if (!this.gameState.data.eraSpecializations) {
      this.gameState.data.eraSpecializations = {};
    }

    // can only choose once per era per run
    if (this.gameState.data.eraSpecializations[eraKey]) {
      this.showNotification(
        'Already chose a specialization for this era',
        'warning',
      );
      return false;
    }

    this.gameState.data.eraSpecializations[eraKey] = specId;
    this.showNotification(
      `Chose ${spec.name}!`,
      'success',
      5000,
    );
    this.gameState.notifyListeners("eraSpecializationChosen", { era: eraKey, specId });
    return true;
  }

  /**
   * Choose a civilization specialization (separate from era specializations)
   */
  chooseCivSpecialization(eraKey, civId) {
    const civSpecs = config.civSpecializations[eraKey];
    if (!civSpecs) return false;

    const spec = civSpecs.find(s => s.id === civId);
    if (!spec) return false;

    if (!this.gameState.data.civSpecializations) {
      this.gameState.data.civSpecializations = {};
    }

    // can only choose once per era per run
    if (this.gameState.data.civSpecializations[eraKey]) {
      this.showNotification(
        'Already chose a civilization for this era',
        'warning',
      );
      return false;
    }

    this.gameState.data.civSpecializations[eraKey] = civId;
    this.showNotification(
      `Chose ${spec.name}! ${spec.description}`,
      'success',
      5000,
    );
    this.gameState.notifyListeners('civSpecializationChosen', { era: eraKey, civId });
    return true;
  }

  /**
   * Get active specialization bonuses for a resource
   * Returns a combined multiplier from all active era and civ specializations
   */
  getSpecializationMultiplier(resource) {
    let mult = this.getConfiguredSpecializationMultiplier(resource);

    // trade route bonuses
    if (this.systems.tradeRouteManager) {
      mult *= this.systems.tradeRouteManager.getRouteMultiplier(resource);
    }

    // wonder bonuses
    if (this.systems.wonderManager) {
      mult *= this.systems.wonderManager.getWonderMultiplier(resource);
    }

    return mult;
  }

  /**
   * Get active specialization bonuses for a worker type.
   *
   * Some specialization config entries target workers (for example merchant or
   * metalworker) instead of produced resources. Resource multipliers are applied
   * per output resource in WorkerManager; worker multipliers apply once to the
   * worker's total production so those config entries match their descriptions.
   */
  getWorkerSpecializationMultiplier(workerType) {
    return this.getConfiguredSpecializationMultiplier(workerType);
  }

  getConfiguredSpecializationMultiplier(target) {
    let mult = 1.0;

    for (const [choices, definitions] of [
      [this.gameState.data.eraSpecializations, config.eraSpecializations],
      [this.gameState.data.civSpecializations, config.civSpecializations],
    ]) {
      for (const [eraKey, specializationId] of Object.entries(choices || {})) {
        const specialization = definitions[eraKey]?.find(({ id }) => id === specializationId);
        if (!specialization) continue;

        for (const factors of [specialization.bonuses, specialization.penalties]) {
          const factor = factors?.[target];
          if (factor) {
            mult *= factor;
          }
        }
      }
    }

    return mult;
  }

  /**
   * Establish a trade route
   */
  establishTradeRoute(routeId) {
    return this.systems.tradeRouteManager?.establishRoute(routeId) || false;
  }

  /**
   * Build a wonder
   */
  buildWonder(wonderId) {
    return this.systems.wonderManager?.buildWonder(wonderId) || false;
  }

  /**
   * Get available trade routes
   */
  getAvailableTradeRoutes() {
    return this.systems.tradeRouteManager?.getAvailableRoutes() || [];
  }

  /**
   * Get available wonders
   */
  getAvailableWonders() {
    return this.systems.wonderManager?.getAvailableWonders() || [];
  }

  /**
   * Apply upgrade effects (side effects only; unlocking handled by GameState)
   */
  applyUpgradeEffect(upgrade) {
    switch (upgrade.id) {
      case "stoneKnapping":
        this.showNotification(
          "Stone knapping mastered! Better tools and hunting unlocked!",
          "info",
          4000,
        );
        break;
      case "fireControl":
        // Fire is now an upgrade, not a resource - no resource to add
        this.showNotification(
          "Fire mastered! Cooking unlocked - you can now cook meat!",
          "info",
          4000,
        );
        break;
      case "boneTools":
        this.showNotification(
          "Bone tools crafted! Gathering efficiency improved!",
          "success",
          4000,
        );
        break;
      case "clothing":
        this.showNotification(
          "Fur clothing created! Population growth increased by 50%!",
          "info",
          4000,
        );
        break;
      case "shelterBuilding":
        this.showNotification(
          "Shelters built! Population growth doubled!",
          "success",
          4000,
        );
        break;
    }
  }

  /**
   * Check if player can afford something
   */
  canAfford(cost) {
    return this.gameState.canAfford(cost);
  }

  /**
   * Record a successful manual player action.
   */
  recordManualAction(amount = 1) {
    if (this.gameState && this.gameState.data) {
      return this.gameState.recordClickAction(amount);
    }
    return 0;
  }

  getPopulationCapacity(currentEra) {
    return this.gameState.getPopulationCapacity?.(currentEra)
      || config.balance?.maxPopulationPerEra?.[currentEra]
      || 50;
  }

  getPopulationSupportResources(eraIdx) {
    const eraKey = config.eraOrder[eraIdx] || this.gameState.data.currentEra;
    return POPULATION_SUPPORT_RESOURCES[eraKey] || ["grain", "agriculture", "cities"];
  }

  getPopulationFoodFactor(currentPop, eraIdx) {
    const growthCfg = config.balance.populationGrowth;
    const supportResources = this.getPopulationSupportResources(eraIdx);
    const availableFood = supportResources.reduce(
      (total, resource) => total + this.gameState.getResource(resource),
      0,
    );
    const targetBuffer = Math.max(1, currentPop * (growthCfg.foodBufferPerCapita || 0.6));
    const foodRatio = availableFood / targetBuffer;
    return Math.max(
      growthCfg.minFoodFactor || 0.2,
      Math.min(1, foodRatio),
    );
  }

  getPopulationWorkerLoadFactor(currentPop) {
    const growthCfg = config.balance.populationGrowth;
    const totalWorkers = this.gameState.getTotalWorkers?.() || 0;
    if (currentPop <= 0 || totalWorkers <= 0) return 1;

    const load = totalWorkers / currentPop;
    const softCap = growthCfg.workerLoadSoftCap || 0.65;
    if (load <= softCap) return 1;

    const penalty = (load - softCap) * (growthCfg.workerLoadPenalty || 0.6);
    return Math.max(growthCfg.minWorkerLoadFactor || 0.45, 1 - penalty);
  }

  /**
   * Update population growth with a capped settlement model.
   *
   * Population is total settlement size. Workers are assigned population, not
   * extra people. Growth scales with population, slows near the era cap, and is
   * moderated by food reserves and over-assignment to work.
   */
  updatePopulationGrowth(deltaTime) {
    const currentPop = this.gameState.getResource("population");
    const currentEra = this.gameState.data.currentEra;
    const eraIdx = getEraIndex(currentEra);
    const maxPop = this.getPopulationCapacity(currentEra);

    if (currentPop <= 0) {
      this.gameState.addResource("population", 1);
      return;
    }

    const capacityPressure = Math.max(0, 1 - currentPop / maxPop);
    if (capacityPressure <= 0) return;

    const growthCfg = config.balance.populationGrowth;
    const baseRate = growthCfg.baseRate || 0.025;
    const perCapitaRate = growthCfg.perCapitaRate || 0.003;
    const eraScaling = growthCfg.eraScaling || 0.18;
    const baseGrowthPerSecond =
      (baseRate + currentPop * perCapitaRate) * (1 + eraIdx * eraScaling);

    // Apply upgrade multipliers (all stack multiplicatively)
    let growthMultiplier = 1.0;

    if (this.gameState.hasUpgrade("clothing")) {
      growthMultiplier *= config.balance.populationGrowth.clothingBonus;
    }
    if (this.gameState.hasUpgrade("shelterBuilding")) {
      growthMultiplier *= config.balance.populationGrowth.shelterBonus;
    }
    // aqueducts bonus from Classical onward
    if (this.gameState.hasUpgrade("civilEngineering") && eraIdx >= 4) {
      growthMultiplier *= config.balance.populationGrowth.aqueductBonus;
    }
    // medicine bonus from Classical onward
    if (this.gameState.hasUpgrade("classicalMedicine") && eraIdx >= 4) {
      growthMultiplier *= config.balance.populationGrowth.medicineBonus;
    }

    // Prestige perk: populationBoom x3
    const pm = this.systems.prestigeManager;
    if (pm) {
      growthMultiplier *= pm.getPopulationGrowthMultiplier();
    }

    const foodFactor = this.getPopulationFoodFactor(currentPop, eraIdx);
    const workerLoadFactor = this.getPopulationWorkerLoadFactor(currentPop);
    const growth = baseGrowthPerSecond
      * capacityPressure
      * foodFactor
      * workerLoadFactor
      * growthMultiplier
      * (deltaTime / 1000);
    const newPop = Math.min(currentPop + growth, maxPop);
    const actualGrowth = newPop - currentPop;

    if (actualGrowth > 0) {
      this.gameState.addResource("population", actualGrowth);
    }
  }

  /**
   * Save the game
   */
  saveGame() {
    try {
      const success = this.gameState.save();
      if (success) {
        this.showNotification(
          "Game saved successfully!",
          "success",
        );
      } else {
        this.showNotification(
          "Failed to save game",
          "error",
        );
      }
      return success;
    } catch (error) {
      console.error("Save game error:", error);
      this.showNotification("Error saving game", "error");
      return false;
    }
  }

  /**
   * Load the game
   */
  loadGame() {
    try {
      const success = this.gameState.load();
      if (success) {
        this.clearActionCooldowns();
        this.showNotification(
          "Game loaded successfully!",
          "success",
        );
        // Restart worker automation for loaded workers
        this.restartWorkerAutomation();
      } else {
        this.showNotification(
          "No saved game found",
          "warning",
        );
      }
      return success;
    } catch (error) {
      console.error("Load game error:", error);
      this.showNotification("Error loading game", "error");
      return false;
    }
  }

  /**
   * Reset the game
   */
  resetGame() {
    if (
      this.persistence.confirm("Reset this run and clear the local save, achievements, wonders, and offline timer? This cannot be undone.")
    ) {
      try {
        // Stop run-specific timers without stopping the main game loop.
        this.systems.workerManager?.resetRunState();
        this.systems.tradeRouteManager?.reset();
        this.clearActionCooldowns();

        // Reset all progress. Prestige uses the preserving reset path separately.
        this.gameState.reset({ preserveWonders: false });

        // Clear browser persistence. There is no server-side save for this app.
        this.persistence.removeSave();
        this.persistence.removeLastActive();
        this.persistence.removeImportBackup();

        // Restart worker automation
        this.restartWorkerAutomation();

        this.showNotification(
          "Game reset successfully!",
          "info",
        );
        return true;
      } catch (error) {
        console.error("Reset game error:", error);
        this.showNotification(
          "Error resetting game",
          "error",
        );
        return false;
      }
    }
    return false;
  }

  /**
   * Perform prestige reset
   */
  performPrestige() {
    const pm = this.systems.prestigeManager;
    if (!pm.canPrestige()) {
      this.showNotification(
        "Reach at least the Neolithic Era to prestige",
        "warning",
      );
      return;
    }

    const epGain = pm.calculateEPGain();
    if (
      !this.persistence.confirm(
        `Prestige for ${epGain} Evolution Points? All resources, workers, and upgrades will be reset.`,
      )
    ) {
      return;
    }

    // Stop all workers before reset
    this.systems.workerManager.resetRunState();

    // Reset trade routes (wonders persist)
    if (this.systems.tradeRouteManager) {
      this.systems.tradeRouteManager.reset();
    }

    const earned = pm.prestige();
    this.clearActionCooldowns();

    // every run starts at Paleolithic now — era-skip perks are gone.

    // Apply First Workers perk: hire 2 gatherers + 1 cook
    if (pm.hasPerk('firstWorkers')) {
      const eraData = this.getCurrentEraData();
      if (eraData?.workers) {
        const gathererData = eraData.workers.find(w => w.id === 'gatherer');
        const cookData = eraData.workers.find(w => w.id === 'cook');
        if (gathererData) {
          this.gameState.addWorker('gatherer', 2, { allowPopulationGrant: true });
          this.systems.workerManager.startWorkerAutomation('gatherer', gathererData);
        }
        if (cookData) {
          this.gameState.addWorker('cook', 1, { allowPopulationGrant: true });
          this.systems.workerManager.startWorkerAutomation('cook', cookData);
        }
      }
    }

    // Cultural Memory: auto-unlock first upgrade of completed eras
    if (pm.hasPerk('culturalMemory')) {
      const eraOrder = config.eraOrder;
      const highestIdx = getEraIndex(pm.getPrestigeData().highestEra);
      for (let i = 0; i < highestIdx; i++) {
        const eraKey = eraOrder[i];
        const eraConfig = config.eraData[eraKey];
        if (eraConfig?.upgrades?.length > 0) {
          // unlock the first upgrade (lowest priority)
          const firstUpgrade = eraConfig.upgrades.reduce((a, b) =>
            a.priority < b.priority ? a : b,
            eraConfig.upgrades[0]
          );
          this.gameState.unlockUpgrade(firstUpgrade.id);
        }
      }
    }

    this.showNotification(
      `Prestiged! Earned ${earned} EP. Multiplier: ${pm.getMultiplier().toFixed(1)}x`,
      "success",
      6000,
    );
    this.logGameEvent({
      name: "Prestige",
      description: `Earned ${earned} Evolution Points. New multiplier: ${pm.getMultiplier().toFixed(1)}x.`,
    });

    this.restartWorkerAutomation();
  }

  purchasePrestigePerk(perkId) {
    const purchased = this.systems.prestigeManager?.purchasePerk(perkId) || false;
    if (purchased) {
      this.showNotification("Perk purchased!", "success");
    }
    return purchased;
  }

  /**
   * Export save as base64 string to clipboard
   */
  async exportSave() {
    try {
      const saveData = this.gameState?.getSaveData();
      if (!saveData) {
        this.showNotification(
          "No save data to export",
          "warning",
        );
        return;
      }

      const encoded = btoa(JSON.stringify(saveData));
      await this.persistence.copyText(encoded);
      this.showNotification(
        "Save exported to clipboard!",
        "success",
      );
    } catch (error) {
      console.error("Export failed:", error);
      this.showNotification("Export failed", "error");
    }
  }

  /**
   * Import save from base64 string
   */
  importSave(encoded) {
    const maxEncodedLength = 512 * 1024;
    const maxDecodedLength = 384 * 1024;

    try {
      const trimmed = typeof encoded === "string" ? encoded.trim() : "";
      if (!trimmed || trimmed.length > maxEncodedLength) {
        throw new Error("Save import is empty or too large");
      }
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) || trimmed.length % 4 !== 0) {
        throw new Error("Save import is not valid base64");
      }

      const decoded = atob(trimmed);
      if (decoded.length > maxDecodedLength) {
        throw new Error("Decoded save import is too large");
      }

      const parsed = JSON.parse(decoded);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Save import must be a JSON object");
      }

      const currentSchemaVersion = this.gameState.createInitialState().schemaVersion;
      if (parsed.schemaVersion && parsed.schemaVersion > currentSchemaVersion) {
        throw new Error(`Unsupported save schema version: ${parsed.schemaVersion}`);
      }

      const importedState = new GameState(this.persistence);
      importedState.loadParsedSave(parsed);
      const saveData = importedState.getSaveData();

      if (!this.persistence.confirm(
        "Import this save? Your current run will be backed up and can be restored until the next import or reset.",
      )) {
        return false;
      }

      this.persistence.writeImportBackup(this.gameState.getSaveData());
      this.persistence.writeSave(saveData);
      if (!this.loadGame()) {
        throw new Error("Imported save could not be loaded");
      }
      this.gameState.notifyListeners("importBackupChange", { available: true });
      this.showNotification("Save imported. Your previous run can be restored.", "success");
      return true;
    } catch (error) {
      console.error("Import failed:", error);
      this.showNotification("Invalid save data", "error");
      return false;
    }
  }

  hasImportBackup() {
    return Boolean(this.persistence.readImportBackup()?.saveData);
  }

  /**
   * Restore the one-level backup captured immediately before the latest import.
   */
  restoreImportBackup() {
    try {
      const backup = this.persistence.readImportBackup();
      if (!backup?.saveData) {
        this.showNotification("No pre-import save is available", "warning");
        return false;
      }

      if (!this.persistence.confirm(
        "Restore the save from before your latest import? The currently imported run will be replaced.",
      )) {
        return false;
      }

      const restoredState = new GameState(this.persistence);
      restoredState.loadParsedSave(backup.saveData);
      this.persistence.writeSave(restoredState.getSaveData());

      const lastActive = Number(backup.lastActive);
      if (Number.isFinite(lastActive) && lastActive > 0) {
        this.persistence.writeLastActive(lastActive);
      } else {
        this.persistence.removeLastActive();
      }

      if (!this.loadGame()) {
        throw new Error("Pre-import save could not be loaded");
      }

      this.persistence.removeImportBackup();
      this.gameState.notifyListeners("importBackupChange", { available: false });
      this.showNotification("Pre-import save restored", "success");
      return true;
    } catch (error) {
      console.error("Import recovery failed:", error);
      this.showNotification("Could not restore the pre-import save", "error");
      return false;
    }
  }

  /**
   * Stop all running systems
   */
  stopAllSystems() {
    // Stop worker automation
    if (this.systems.workerManager) {
      this.systems.workerManager.stopAllWorkers();
    }

    // Stop trade route timers
    if (this.systems.tradeRouteManager) {
      this.systems.tradeRouteManager.destroy();
    }

    this.systems.offlineManager?.destroy();
    this.clearActionCooldowns();

    // Stop game loop
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  /**
   * Restart worker automation after load/reset
   */
  restartWorkerAutomation() {
    if (this.systems.workerManager) {
      this.systems.workerManager.restartAllWorkers();
    }
  }

  /**
   * Get current era data with workers and upgrades
   */
  getCurrentEraData() {
    const currentEra = this.gameState.data.currentEra;
    return config.eraData[currentEra] || config.eraData.paleolithic;
  }

  /**
   * Get comprehensive data for all eras
   */
  getAllEraData() {
    return config.eraData;
  }

  /**
   * Check if era advancement is possible and notify player (once per opportunity)
   */
  checkEraAdvancement() {
    const canAdvance = this.gameState.canAdvanceEra();

    if (canAdvance && !this.eraAdvanceNotified) {
      const currentEra = this.gameState.data.currentEra;
      const nextEra = this.getNextEra(currentEra);

      if (nextEra) {
        this.showNotification(
          `🌟 Ready to advance to ${
            config.eraData[nextEra]?.name || nextEra
          }!`,
          "info",
          5000,
        );
        this.eraAdvanceNotified = true;
      }
    } else if (!canAdvance) {
      // reset flag when requirements no longer met (e.g., spent resources)
      this.eraAdvanceNotified = false;
    }
  }

  /**
   * Get the next era in progression
   */
  getNextEra(currentEra) {
    const eraOrder = config.eraOrder;
    const currentIndex = getEraIndex(currentEra);

    if (currentIndex >= 0 && currentIndex < eraOrder.length - 1) {
      return eraOrder[currentIndex + 1];
    }

    return null;
  }

  /**
   * Advance to the next era
   */
  advanceEra() {
    const currentEra = this.gameState.data.currentEra;
    const nextEra = this.getNextEra(currentEra);

    if (!nextEra) {
      this.showNotification(
        "You are already in the final era!",
        "warning",
      );
      return false;
    }

    if (!this.gameState.canAdvanceEra()) {
      this.showNotification(
        "Requirements not met for era advancement",
        "error",
      );
      return false;
    }

    // Spend advancement cost. Population is a threshold for era readiness,
    // not a consumed resource.
    const eraData = this.getCurrentEraData();
    if (eraData.advancementCost) {
      this.gameState.spendResources(eraData.advancementCost);
    }

    // Advance the era (sets era, resets progress, notifies listeners)
    this.gameState.setEra(nextEra);
    this.clearActionCooldowns();

    // Reset the advancement notification flag for the new era
    this.eraAdvanceNotified = false;

    // Grant starter resources for the new era
    this.onEraTransition(nextEra);

    // Show advancement notification
    const eraInfo = config.eraData[nextEra];
    this.showNotification(
      `Entered the ${eraInfo?.name || nextEra}! ${eraInfo?.description || ""}`,
      "success",
      10000,
    );
    this.logGameEvent({
      name: `Entered ${eraInfo?.name || nextEra}`,
      description: eraInfo?.description || "Civilization advanced to a new era.",
    });

    // Restart worker automation for new era
    this.restartWorkerAutomation();

    return true;
  }

  /**
   * Handle era transition effects
   */
  onEraTransition(toEra) {
    const starterPacks = {
      neolithic: { grain: 80, clay: 50, tools: 25, pottery: 10, livestock: 12 },
      bronze: { copper: 40, tin: 20, tools: 15 },
      iron: { iron: 80, coal: 20, bronze: 20, stones: 30, knowledge: 30 },
      classical: {
        cities: 15,
        knowledge: 30,
        coins: 12,
        writing: 12,
        iron: 20,
      },
      medieval: {
        agriculture: 25,
        mills: 8,
        manuscripts: 15,
        religion: 8,
        guilds: 10,
        coins: 20,
        trade: 15,
      },
      renaissance: {
        printing: 20,
        manuscripts: 15,
        banking: 12,
        navigation: 12,
        coins: 25,
        trade: 20,
        optics: 15,
      },
      enlightenment: {
        reason: 40,
        knowledge: 30,
        printing: 25,
        clockwork: 15,
        academies: 10,
        ships: 20,
      },
      industrial: {
        coal: 120,
        iron: 30,
        copper: 20,
        steam: 30,
        factories: 20,
        reason: 20,
      },
      electric: {
        dynamo: 60,
        electricity: 50,
        steel: 50,
        telephone: 20,
        chemicals: 30,
        oil: 40,
      },
      atomic: {
        uranium: 30,
        aircraft: 50,
        plastics: 30,
        radar: 20,
        electricity: 80,
        chemicals: 40,
      },
      information: {
        silicon: 200,
        computers: 60,
        internet: 20,
        steel: 20,
        electricity: 50,
        data: 20,
      },
      space: {
        rockets: 80,
        satellites: 20,
        computers: 80,
        steel: 80,
        electricity: 60,
        fusion: 20,
      },
      galactic: {
        robotics: 60,
        solarPanels: 80,
        computers: 100,
        satellites: 40,
        fusion: 50,
        quantumComputers: 20,
      },
      universal: {
        quantumComputers: 80,
        antimatter: 40,
        wormholes: 20,
        realityEngines: 8,
        existentialEnergy: 20,
        consciousnessTransfer: 8,
      },
    };

    const starterPack = starterPacks[toEra];
    if (!starterPack) return;

    const starterPackMult = config.balance?.eraStarterPackMultiplier ?? 1;
    Object.entries(starterPack).forEach(([resource, amount]) => {
      this.gameState.addResource(resource, Math.max(1, Math.floor(amount * starterPackMult)));
    });
  }

  /**
   * Destroy the game manager and cleanup resources
   */
  destroy() {
    try {
      // Stop all systems
      this.stopAllSystems();

      // Stop performance monitoring
      this.stopPerformanceMonitoring();

      // Clear all event listeners
      this.gameState?.removeAllListeners();

      // Clear auto-save interval
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
      }

      // Reset references
      this.gameState = null;
      this.systems = {};
      this.store = null;
      this.pendingNotifications = [];
      this.pendingLogEntries = [];
      this.initialized = false;
    } catch (error) {
      console.error("Error destroying GameManager:", error);
    }
  }

  /**
   * Get game statistics for debugging and analytics
   */
  getGameStats() {
    if (!this.gameState) return null;

    const data = this.gameState.data;
    const totalResources = Object.values(data.resources).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalWorkers = Object.values(data.workers).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalUpgrades = Object.values(data.upgrades).filter(Boolean).length;

    return {
      era: data.currentEra,
      playTime: data.totalPlayTime,
      totalResources,
      totalWorkers,
      totalUpgrades,
      population: data.resources.population || 0,
      progression: data.progression,
    };
  }

  /**
   * Performance monitoring and optimization
   */
  startPerformanceMonitoring() {
    this.performanceStats = {
      frameCount: 0,
      totalFrameTime: 0,
      averageFPS: 0,
      lastFPSUpdate: performance.now(),
    };

    // Update FPS every second
    this.fpsUpdateInterval = setInterval(() => {
      const now = performance.now();
      const deltaTime = now - this.performanceStats.lastFPSUpdate;

      if (deltaTime >= 1000) {
        this.performanceStats.averageFPS = Math.round(
          (this.performanceStats.frameCount * 1000) / deltaTime,
        );
        this.performanceStats.frameCount = 0;
        this.performanceStats.lastFPSUpdate = now;
      }
    }, 1000);
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring() {
    if (this.fpsUpdateInterval) {
      clearInterval(this.fpsUpdateInterval);
      this.fpsUpdateInterval = null;
    }
    this.performanceStats = null;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return this.performanceStats ? { ...this.performanceStats } : null;
  }
}
