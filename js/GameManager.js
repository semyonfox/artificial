/**
 * Game Manager - Main game coordination system
 * Handles game logic, progression, and system coordination
 */

import { GameState } from "./core/GameState.js";
import { ResourceManager } from "./systems/ResourceManager.js";
import { UIManager } from "./systems/UIManager.js";
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

export class GameManager {
  constructor() {
    this.initialized = false;
    this.systems = {};
    this.gameLoopId = null;
    this.lastUpdateTime = performance.now();
    this.gameState = null;

    // periodic task accumulators (ms)
    this.uiUpdateAccum = 0;
    this.eraCheckAccum = 0;
    this.validateAccum = 0;

    // track if we've already notified about era advancement opportunity
    this.eraAdvanceNotified = false;

    // store reference for notifications (set by gameStore.initialize)
    this.store = null;

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
      this.gameState = new GameState();

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

      // Initial UI update
      this.updateUI();

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

    this.systems.offlineManager = new OfflineManager(this.gameState);
    this.systems.achievementManager = new AchievementManager(this.gameState);
    this.systems.prestigeManager = new PrestigeManager(this.gameState);

    // Trade routes and wonders
    this.systems.tradeRouteManager = new TradeRouteManager(this.gameState);
    this.systems.wonderManager = new WonderManager(this.gameState);

    // UIManager is now optional (Svelte takes over UI duties)
    // Only initialize if running in legacy mode (index.bootstrap.html)
    if (document.getElementById('action-buttons-container')) {
      this.systems.uiManager = new UIManager(this.gameState, this);
    }
  }

  /**
   * Connect systems that need references to each other
   */
  connectSystems() {
    // Connect UI manager to other systems (if available)
    if (this.systems.uiManager) {
      this.systems.resourceManager.setUIManager(this.systems.uiManager);
      this.systems.workerManager.setUIManager(this.systems.uiManager);
      this.systems.eventManager.setUIManager(this.systems.uiManager);
      this.systems.achievementManager.setUIManager(this.systems.uiManager);
    }

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
  }

  /**
   * Show notification via store or UIManager
   */
  showNotification(message, type = 'success', duration = 2000) {
    if (this.store) {
      this.store.showNotification(message, type, duration);
    } else if (this.systems.uiManager) {
      this.systems.uiManager.showNotification(message, type, duration);
    }
  }

  /**
   * Set up event listeners for cross-system communication
   */
  setupEventListeners() {
    // Listen for resource changes to update UI
    this.gameState.addListener("resourceChange", (data) => {
      this.updateProgression();
      if (this.systems.uiManager) {
        this.systems.uiManager.updateResources();
      }
    });

    // Listen for worker changes
    this.gameState.addListener("workerChange", (data) => {
      if (this.systems.uiManager) {
        this.systems.uiManager.updateWorkers();
      }
    });

    // Listen for upgrade unlocks
    this.gameState.addListener("upgradeUnlocked", (data) => {
      this.showNotification(
        `Unlocked: ${data.upgradeId}`,
        "success",
      );
      if (this.systems.uiManager) {
        this.systems.uiManager.updateUpgrades();
      }
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

    if (this.systems.workerManager) {
      this.systems.workerManager.update(deltaTime);
    }

    if (this.systems.achievementManager) {
      this.systems.achievementManager.update(deltaTime);
    }

    // Update UI periodically (every 1 second)
    this.uiUpdateAccum += deltaTime;
    if (this.uiUpdateAccum >= 1000) {
      this.uiUpdateAccum -= 1000;
      this.updateUI();
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
   * Perform a game action with button feedback
   */
  performAction(button, action, cooldownMs = 1000) {
    if (button.disabled) return;

    // Disable button temporarily
    button.disabled = true;
    button.style.opacity = "0.6";

    try {
      // Execute the action
      action();

      // Update UI
      this.updateUI();

      // Re-enable button after cooldown
      setTimeout(() => {
        button.disabled = false;
        button.style.opacity = "1";
      }, cooldownMs);
    } catch (error) {
      console.error("Action failed:", error);
      button.disabled = false;
      button.style.opacity = "1";
    }
  }

  /**
   * Perform a config-driven click action
   */
  doClickAction(action) {
    const result = this.systems.resourceManager.performClickAction(action);
    if (result) {
      this.updateProgression(1);
    }
    return result;
  }

  /**
   * Hire a worker
   */
  hireWorker(workerType) {
    this.systems.workerManager.hireWorker(workerType);
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
    const costMult = this.systems.prestigeManager?.getUpgradeCostMultiplier() || 1;
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
      this.updateUI();
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
    this.updateUI();
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
    this.updateUI();
    return true;
  }

  /**
   * Get active specialization bonuses for a resource
   * Returns a combined multiplier from all active era and civ specializations
   */
  getSpecializationMultiplier(resource) {
    let mult = 1.0;

    // era specializations
    const eraSpecs = this.gameState.data.eraSpecializations;
    if (eraSpecs) {
      for (const [eraKey, specId] of Object.entries(eraSpecs)) {
        const specs = config.eraSpecializations[eraKey];
        if (!specs) continue;
        const spec = specs.find(s => s.id === specId);
        if (!spec) continue;

        if (spec.bonuses && spec.bonuses[resource]) {
          mult *= spec.bonuses[resource];
        }
        if (spec.penalties && spec.penalties[resource]) {
          mult *= spec.penalties[resource];
        }
      }
    }

    // civilization specializations
    const civSpecs = this.gameState.data.civSpecializations;
    if (civSpecs) {
      for (const [eraKey, civId] of Object.entries(civSpecs)) {
        const specs = config.civSpecializations[eraKey];
        if (!specs) continue;
        const spec = specs.find(s => s.id === civId);
        if (!spec) continue;

        if (spec.bonuses && spec.bonuses[resource]) {
          mult *= spec.bonuses[resource];
        }
        if (spec.penalties && spec.penalties[resource]) {
          mult *= spec.penalties[resource];
        }
      }
    }

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
    let mult = 1.0;

    const eraSpecs = this.gameState.data.eraSpecializations;
    if (eraSpecs) {
      for (const [eraKey, specId] of Object.entries(eraSpecs)) {
        const specs = config.eraSpecializations[eraKey];
        if (!specs) continue;
        const spec = specs.find(s => s.id === specId);
        if (!spec) continue;

        if (spec.bonuses && spec.bonuses[workerType]) {
          mult *= spec.bonuses[workerType];
        }
        if (spec.penalties && spec.penalties[workerType]) {
          mult *= spec.penalties[workerType];
        }
      }
    }

    const civSpecs = this.gameState.data.civSpecializations;
    if (civSpecs) {
      for (const [eraKey, civId] of Object.entries(civSpecs)) {
        const specs = config.civSpecializations[eraKey];
        if (!specs) continue;
        const spec = specs.find(s => s.id === civId);
        if (!spec) continue;

        if (spec.bonuses && spec.bonuses[workerType]) {
          mult *= spec.bonuses[workerType];
        }
        if (spec.penalties && spec.penalties[workerType]) {
          mult *= spec.penalties[workerType];
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
   * Update game progression
   */
  updateProgression(amount = 1) {
    if (this.gameState && this.gameState.data) {
      return this.gameState.recordClickAction(amount);
    }
    return 0;
  }

  /**
   * Update population growth - era-scaled with upgrade and prestige multipliers
   * Base: 0.05 * (1 + eraIndex * 0.3) pop/sec
   */
  updatePopulationGrowth(deltaTime) {
    const currentPop = this.gameState.getResource("population");
    const currentEra = this.gameState.data.currentEra;
    const eraIdx = getEraIndex(currentEra);

    // Robotic Age specialization reduces pop cap by 30%
    let maxPop = config.balance?.maxPopulationPerEra?.[currentEra] || 50;
    const spec = this.gameState.data.eraSpecializations;
    if (spec && spec.industrial === 'roboticAge') {
      maxPop = Math.floor(maxPop * 0.7);
    }

    if (currentPop >= maxPop) return;

    // Base growth with era scaling
    const baseRate = config.balance.populationGrowth.baseRate;
    const eraScaling = config.balance.populationGrowth.eraScaling;
    let baseGrowthPerSecond = baseRate * (1 + eraIdx * eraScaling);

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

    const growth = baseGrowthPerSecond * growthMultiplier * (deltaTime / 1000);
    const newPop = Math.min(currentPop + growth, maxPop);
    const actualGrowth = newPop - currentPop;

    if (actualGrowth > 0) {
      this.gameState.addResource("population", actualGrowth);
    }
  }

  /**
   * Update the UI display
   */
  updateUI() {
    if (this.systems.uiManager) {
      this.systems.uiManager.updateUI();
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
        this.showNotification(
          "Game loaded successfully!",
          "success",
        );
        this.updateUI();
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
      confirm("Reset this run and clear the local save, achievements, wonders, and offline timer? This cannot be undone.")
    ) {
      try {
        // Stop run-specific timers without stopping the main game loop.
        this.systems.workerManager?.stopAllWorkers();
        this.systems.tradeRouteManager?.reset();

        // Reset all progress. Prestige uses the preserving reset path separately.
        this.gameState.reset({ preserveWonders: false });

        // Clear browser persistence. There is no server-side save for this app.
        localStorage.removeItem(config.storage.saveKey);
        localStorage.removeItem("lastActive");

        // Restart worker automation
        this.restartWorkerAutomation();

        // Update UI
        this.updateUI();

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
      !confirm(
        `Prestige for ${epGain} Evolution Points? All resources, workers, and upgrades will be reset.`,
      )
    ) {
      return;
    }

    // Stop all workers before reset
    this.systems.workerManager.stopAllWorkers();

    // Reset trade routes (wonders persist)
    if (this.systems.tradeRouteManager) {
      this.systems.tradeRouteManager.reset();
    }

    const earned = pm.prestige();

    // every run starts at Paleolithic now — era-skip perks are gone.

    // Apply First Workers perk: hire 2 gatherers + 1 cook
    if (pm.hasPerk('firstWorkers')) {
      const eraData = this.getCurrentEraData();
      if (eraData?.workers) {
        const gathererData = eraData.workers.find(w => w.id === 'gatherer');
        const cookData = eraData.workers.find(w => w.id === 'cook');
        if (gathererData) {
          this.gameState.data.workers.gatherer = 2;
          this.systems.workerManager.startWorkerAutomation('gatherer', gathererData);
        }
        if (cookData) {
          this.gameState.data.workers.cook = 1;
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

    this.restartWorkerAutomation();
    this.updateUI();
  }

  /**
   * Export save as base64 string to clipboard
   */
  exportSave() {
    try {
      const saveData = localStorage.getItem(config.storage.saveKey);
      if (!saveData) {
        this.showNotification(
          "No save data to export",
          "warning",
        );
        return;
      }
      const encoded = btoa(saveData);
      navigator.clipboard.writeText(encoded).then(() => {
        this.showNotification(
          "Save exported to clipboard!",
          "success",
        );
      });
    } catch (error) {
      console.error("Export failed:", error);
      this.showNotification("Export failed", "error");
    }
  }

  /**
   * Import save from base64 string
   */
  importSave(encoded) {
    try {
      const decoded = atob(encoded.trim());
      JSON.parse(decoded); // validate JSON
      localStorage.setItem(config.storage.saveKey, decoded);
      this.loadGame();
      this.showNotification("Save imported!", "success");
    } catch (error) {
      console.error("Import failed:", error);
      this.showNotification("Invalid save data", "error");
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
            config.eras[nextEra]?.name || nextEra
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

    // Spend advancement cost
    const eraData = this.getCurrentEraData();
    if (eraData.advancementCost) {
      this.gameState.spendResources(eraData.advancementCost);
    }

    // Advance the era (sets era, resets progress, notifies listeners)
    this.gameState.setEra(nextEra);

    // Reset the advancement notification flag for the new era
    this.eraAdvanceNotified = false;

    // Grant starter resources for the new era
    this.onEraTransition(currentEra, nextEra);

    // Show advancement notification
    const eraInfo = config.eras[nextEra];
    this.showNotification(
      `Entered the ${eraInfo?.name || nextEra}! ${eraInfo?.description || ""}`,
      "success",
      10000,
    );

    // Update UI
    this.updateUI();

    // Restart worker automation for new era
    this.restartWorkerAutomation();

    return true;
  }

  /**
   * Handle era transition effects
   */
  onEraTransition(fromEra, toEra) {
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

    Object.entries(starterPack).forEach(([resource, amount]) => {
      this.gameState.addResource(resource, amount);
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
