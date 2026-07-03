/**
 * GameState - Centralized state management for the Evolution Clicker game
 * Provides a clean interface for state access, validation, and persistence
 */

import { config } from "./config.js";

const MAX_SAFE_STATE_VALUE = 1_000_000_000_000;
const MAX_SAFE_PLAY_TIME_MS = 1000 * 60 * 60 * 24 * 365 * 25;

export class GameState {
  constructor() {
    this.data = this.createInitialState();
    this.listeners = new Map();
    this.lastSave = Date.now();
  }

  /**
   * Create the initial game state with all necessary properties
   */
  createInitialState() {
    return {
      // Core game properties
      schemaVersion: 2,
      currentEra: "paleolithic",
      gameStartTime: Date.now(),
      totalPlayTime: 0,

      // Resources - organized by era for better management
      resources: this.createInitialResources(),

      // monotonic counter: total amount of each resource ever produced.
      // never decremented on consumption. feeds prestige EP calculation.
      lifetimeProduced: this.createInitialLifetimeProduced(),

      // Workers - all worker types across eras
      workers: this.createInitialWorkers(),

      // Upgrades - organized by era and status
      upgrades: this.createInitialUpgrades(),

      // Progress tracking
      progression: {
        eraProgress: 0,
        totalClicks: 0,
        totalResources: 0,
        totalWorkers: 0,
        totalUpgrades: 0,
        achievements: [],
      },

      // Game settings
      settings: {
        autoSave: true,
        notifications: true,
        soundEnabled: true,
        fastMode: false,
      },

      // Era specialization choices (reset on prestige)
      eraSpecializations: {},

      // Civilization specializations (per-run; cleared on prestige reset)
      civSpecializations: {},

      // Trade routes (reset on prestige)
      tradeRoutes: {
        activeRoutes: [],
        routeProgress: {},
      },

      // Wonders (persist through prestige - permanent achievements)
      wonders: {
        built: [],
      },
    };
  }

  /**
   * Initialize lifetime production counters lazily. Resources appear here only
   * after they are produced in the current run.
   */
  createInitialLifetimeProduced() {
    return {};
  }

  /**
   * Create initial resource state. Keep this sparse so reset/prestige does not
   * carry old era resources as inert zero-value entries.
   */
  createInitialResources() {
    return {
      sticks: 10,
      stones: 5,
      population: 1,
    };
  }

  /**
   * Create initial worker state. Workers are added lazily when hired so old
   * era worker slots do not remain after prestige.
   */
  createInitialWorkers() {
    return {};
  }

  /**
   * Create initial upgrade state
   */
  createInitialUpgrades() {
    return {
      // Paleolithic upgrades
      fireControl: false,
      stoneKnapping: false,
      clothing: false,
      boneTools: false,
      shelterBuilding: false,

      // Neolithic upgrades
      agriculture: false,
      pottery: false,
      animalDomestication: false,
      weaving: false,
      settlement: false,

      // Bronze Age upgrades
      copperMining: false,
      tinMining: false,
      alloying: false,
      theWheel: false,
      writingSystems: false,

      // Iron Age upgrades
      ironSmelting: false,
      bloomery: false,
      coinage: false,
      roadBuilding: false,

      // Classical upgrades
      civilEngineering: false,
      philosophySchools: false,
      classicalMedicine: false,
      classicalMathematics: false,

      // Medieval upgrades
      heavyPlow: false,
      watermills: false,
      guildSystem: false,
      scriptoria: false,

      // Renaissance upgrades
      printingPress: false,
      renaissanceNavigation: false,
      renaissanceBanking: false,
      scientificMethod: false,

      // Enlightenment upgrades
      scientificAcademies: false,
      precisionEngineering: false,
      naturalPhilosophy: false,
      colonialism: false,

      // Industrial Age upgrades
      steamEngine: false,
      electrification: false,
      bessemer: false,

      // Electric Age upgrades
      electricalGrid: false,
      telephony: false,
      organicChemistry: false,
      internalCombustion: false,
      assemblyLine: false,

      // Atomic Age upgrades
      nuclearFission: false,
      jetPropulsion: false,
      polymerScience: false,
      radarTechnology: false,
      transistor: false,

      // Information Age upgrades
      siliconProcessing: false,
      microprocessor: false,
      networking: false,
      softwareEngineering: false,

      // Space Age upgrades
      rocketry: false,
      orbitalHab: false,
      fusionResearch: false,
      spaceRobotics: false,

      // Galactic upgrades
      dysonSwarm: false,
      quantumComputing: false,
      wormholeTheory: false,
      antimatterContainment: false,

      // Universal upgrades
      realityEngineering: false,
      multiversalPhysics: false,
      consciousnessUpload: false,
    };
  }

  /**
   * Normalize era keys from legacy saves or corrupted data
   */
  normalizeEraKey(eraKey) {
    if (typeof eraKey !== "string" || eraKey.length === 0) {
      return "paleolithic";
    }

    const normalized = eraKey.trim().toLowerCase();
    const legacyEraMap = {
      mesolithic: "neolithic",
      bronzeage: "bronze",
      ironage: "iron",
      classicalera: "classical",
      medievalera: "medieval",
      renaissanceera: "renaissance",
      enlightenmentera: "enlightenment",
      industrialage: "industrial",
      electricage: "electric",
      atomicage: "atomic",
      informationage: "information",
      spaceage: "space",
      galacticage: "galactic",
      universalage: "universal",
    };

    const mapped = legacyEraMap[normalized] || normalized;
    return config.eraData[mapped] ? mapped : "paleolithic";
  }

  /**
   * Get a copy of the current state
   */
  getState() {
    return { ...this.data };
  }

  /**
   * Get a specific resource value
   */
  getResource(resourceType) {
    return this.data.resources[resourceType] || 0;
  }

  /**
   * Maximum settlement population for an era. Active, offline, and prestige
   * population grants use this same cap.
   */
  getPopulationCapacity(eraKey = this.data.currentEra) {
    let maxPop = config.balance?.maxPopulationPerEra?.[eraKey] || 50;
    if (this.data.eraSpecializations?.industrial === "roboticAge") {
      maxPop = Math.floor(maxPop * 0.7);
    }
    return Math.max(1, maxPop);
  }

  /**
   * Add resources with validation. positive amounts also bump the lifetime
   * production counter, which is monotonic and used by prestige EP.
   */
  addResource(resourceType, amount) {
    if (typeof amount !== "number" || isNaN(amount)) {
      console.warn(`Invalid amount for resource ${resourceType}:`, amount);
      return false;
    }

    const oldValue = this.data.resources[resourceType] || 0;
    let actualAmount = amount;

    if (resourceType === "population" && amount > 0) {
      const populationRoom = this.getPopulationCapacity() - oldValue;
      actualAmount = Math.min(amount, Math.max(0, populationRoom));
    }

    const newValue = Math.max(0, oldValue + actualAmount);
    if (newValue === oldValue) {
      return false;
    }

    if (newValue > 0) {
      this.data.resources[resourceType] = newValue;
    } else {
      delete this.data.resources[resourceType];
    }

    // bump lifetime counter on positive grants only
    if (actualAmount > 0) {
      if (!this.data.lifetimeProduced) this.data.lifetimeProduced = {};
      this.data.lifetimeProduced[resourceType] =
        (this.data.lifetimeProduced[resourceType] || 0) + actualAmount;
    }

    if (resourceType === "population" && actualAmount < 0) {
      this.clampWorkersToPopulation();
    }

    // Trigger resource change listeners
    this.notifyListeners("resourceChange", {
      resourceType,
      oldValue,
      newValue,
      amount: actualAmount,
    });

    return true;
  }

  /**
   * Get lifetime produced amount for a resource (monotonic counter)
   */
  getLifetimeProduced(resourceType) {
    return this.data.lifetimeProduced?.[resourceType] || 0;
  }

  /**
   * Check if player can afford a cost
   */
  canAfford(costs) {
    if (!costs || typeof costs !== "object") return true;

    return Object.entries(costs).every(([resource, amount]) => {
      return this.getResource(resource) >= amount;
    });
  }

  /**
   * Spend resources if possible
   */
  spendResources(costs) {
    if (!this.canAfford(costs)) return false;

    Object.entries(costs).forEach(([resource, amount]) => {
      if (resource === "population") return;
      this.addResource(resource, -amount);
    });

    return true;
  }

  /**
   * Get worker count
   */
  getWorkerCount(workerType) {
    return this.data.workers[workerType] || 0;
  }

  /**
   * Get total assigned workers across all worker types.
   */
  getTotalWorkers() {
    return Object.values(this.data.workers).reduce(
      (sum, count) => sum + count,
      0,
    );
  }

  /**
   * Population is total settlement size; workers are assigned people within it.
   */
  getAvailablePopulation() {
    return Math.max(0, Math.floor(this.getResource("population")) - this.getTotalWorkers());
  }

  /**
   * Keep loaded/perk-granted saves internally consistent.
   */
  ensurePopulationForWorkers() {
    const totalWorkers = this.getTotalWorkers();
    if (totalWorkers > this.getResource("population")) {
      this.addResource("population", totalWorkers - this.getResource("population"));
    }
  }

  /**
   * If population falls below assigned workers, remove assignments until the
   * invariant is restored. Higher-era/later-added worker slots are reduced
   * first so early survival jobs are the last to be removed.
   */
  clampWorkersToPopulation() {
    const oldTotalWorkers = this.getTotalWorkers();
    let overflow = oldTotalWorkers - Math.floor(this.getResource("population"));
    if (overflow <= 0) return 0;

    const workerEntries = Object.entries(this.data.workers).reverse();
    let removed = 0;
    for (const [workerType, count] of workerEntries) {
      if (overflow <= 0) break;
      const reduction = Math.min(count, overflow);
      const newCount = count - reduction;
      if (newCount > 0) {
        this.data.workers[workerType] = newCount;
      } else {
        delete this.data.workers[workerType];
      }
      overflow -= reduction;
      removed += reduction;
    }

    if (removed > 0) {
      this.notifyListeners("workerChange", {
        workerType: "populationClamp",
        oldCount: oldTotalWorkers,
        newCount: oldTotalWorkers - removed,
        count: -removed,
      });
    }

    return removed;
  }

  /**
   * Release worker assignments that are not available in the active era.
   */
  releaseWorkersOutsideEra(eraKey = this.data.currentEra, options = {}) {
    const allowedWorkers = new Set(
      (config.eraData?.[eraKey]?.workers || []).map((worker) => worker.id),
    );
    const oldTotalWorkers = this.getTotalWorkers();
    let removed = 0;

    Object.entries(this.data.workers || {}).forEach(([workerType, count]) => {
      if (!allowedWorkers.has(workerType)) {
        removed += count;
        delete this.data.workers[workerType];
      }
    });

    if (removed > 0 && options.notify !== false) {
      this.notifyListeners("workerChange", {
        workerType: "eraTransition",
        oldCount: oldTotalWorkers,
        newCount: oldTotalWorkers - removed,
        count: -removed,
      });
    }

    return removed;
  }

  /**
   * Add workers
   */
  addWorker(workerType, count = 1, options = {}) {
    const oldCount = this.data.workers[workerType] || 0;
    const assignableLimit = options.allowPopulationGrant
      ? Math.max(0, this.getPopulationCapacity() - this.getTotalWorkers())
      : this.getAvailablePopulation();
    const assignableCount = count > 0
      ? Math.min(count, assignableLimit)
      : count;
    const newCount = Math.max(0, oldCount + assignableCount);
    if (newCount > 0) {
      this.data.workers[workerType] = newCount;
    } else {
      delete this.data.workers[workerType];
    }
    if (options.allowPopulationGrant) {
      this.ensurePopulationForWorkers();
    }
    const storedNewCount = this.data.workers[workerType] || 0;
    if (storedNewCount === oldCount) return false;

    this.notifyListeners("workerChange", {
      workerType,
      oldCount,
      newCount: storedNewCount,
      count: storedNewCount - oldCount,
    });
    return true;
  }

  /**
   * Check if upgrade is unlocked
   */
  hasUpgrade(upgradeId) {
    return this.data.upgrades[upgradeId] === true;
  }

  /**
   * Unlock an upgrade
   */
  unlockUpgrade(upgradeId) {
    if (this.data.upgrades.hasOwnProperty(upgradeId)) {
      const wasUnlocked = this.data.upgrades[upgradeId];
      this.data.upgrades[upgradeId] = true;

      if (!wasUnlocked) {
        this.notifyListeners("upgradeUnlocked", { upgradeId });
      }

      return true;
    }
    return false;
  }

  /**
   * Get efficiency multiplier for a resource type
   */
  getEfficiencyMultiplier(resourceType) {
    let multiplier = 1.0;

    // Apply simple global upgrade bonuses
    if (this.data.upgrades.boneTools) {
      multiplier *= 2.0;
    }

    if (this.data.upgrades.efficiency) {
      multiplier *= 1 + this.data.upgrades.efficiency * 0.1;
    }

    // Apply resource-specific multipliers based on unlocked upgrades
    const resourceMults = config.efficiencyMultipliers?.[resourceType];
    if (resourceMults && typeof resourceMults === "object") {
      Object.entries(resourceMults).forEach(([upgradeId, mult]) => {
        if (this.data.upgrades[upgradeId]) {
          multiplier *= mult;
        }
      });
    }

    return multiplier;
  }

  /**
   * Get worker food consumption rate
   */
  getWorkerFoodConsumption() {
    const baseConsumption = config.gameVariables?.workerFoodConsumption || 1;
    const totalWorkers = Object.values(this.data.workers).reduce(
      (sum, count) => sum + count,
      0,
    );

    return Math.max(0, totalWorkers * baseConsumption);
  }

  /**
   * Check if era advancement is possible using eraData.advancementCost
   */
  canAdvanceEra() {
    const currentEra = this.data.currentEra;
    const eraData = config.eraData[currentEra];

    if (!eraData || !eraData.advancementCost) return false;

    return this.canAfford(eraData.advancementCost);
  }

  /**
   * Set the current era and notify listeners
   */
  setEra(newEra) {
    const oldEra = this.data.currentEra;
    this.data.currentEra = newEra;
    this.data.progression.eraProgress = 0;
    const releasedWorkers = this.releaseWorkersOutsideEra(newEra);
    this.notifyListeners("eraAdvancement", { oldEra, newEra, releasedWorkers });
  }

  /**
   * Record successful manual player actions.
   */
  recordClickAction(amount = 1) {
    const clickAmount = Number.isFinite(amount) ? amount : 1;
    const oldValue = this.data.progression.totalClicks || 0;
    const newValue = oldValue + clickAmount;

    this.data.progression = {
      ...this.data.progression,
      totalClicks: newValue,
    };

    this.notifyListeners("progressionChange", {
      field: "totalClicks",
      oldValue,
      newValue,
      amount: clickAmount,
    });

    return newValue;
  }

  /**
   * Get total resource value (for progression tracking)
   */
  getTotalResourceValue() {
    return Object.values(this.data.resources).reduce(
      (sum, amount) => sum + amount,
      0,
    );
  }

  /**
   * Register event listener
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.listeners.clear();
  }

  /**
   * Notify listeners of state changes
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Validate game state integrity
   */
  validate() {
    const errors = [];

    const clampSafeNumber = (value, fallback = 0, max = MAX_SAFE_STATE_VALUE) => {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return fallback;
      }
      return Math.min(value, max);
    };

    const initial = this.createInitialState();
    if (!Number.isInteger(this.data.schemaVersion) || this.data.schemaVersion < 1) {
      errors.push(`Invalid schema version: ${this.data.schemaVersion}`);
      this.data.schemaVersion = initial.schemaVersion;
    } else if (this.data.schemaVersion > initial.schemaVersion) {
      errors.push(`Unsupported future schema version: ${this.data.schemaVersion}`);
      this.data.schemaVersion = initial.schemaVersion;
    }

    this.data.gameStartTime = clampSafeNumber(this.data.gameStartTime, Date.now(), Date.now());
    this.data.totalPlayTime = clampSafeNumber(this.data.totalPlayTime, 0, MAX_SAFE_PLAY_TIME_MS);
    this.data.lastSave = clampSafeNumber(this.data.lastSave, Date.now(), Date.now());

    // Validate current era
    const normalizedEra = this.normalizeEraKey(this.data.currentEra);
    if (normalizedEra !== this.data.currentEra) {
      errors.push(
        `Invalid current era: ${this.data.currentEra}, reset to ${normalizedEra}`,
      );
      this.data.currentEra = normalizedEra;
    }

    // Validate resources
    Object.entries(this.data.resources).forEach(([resource, value]) => {
      const clamped = clampSafeNumber(value, 0);
      if (clamped !== value) {
        errors.push(`Invalid resource value: ${resource} = ${value}`);
        this.data.resources[resource] = clamped;
      }
    });
    const maxPopulation = this.getPopulationCapacity();
    if (this.getResource("population") > maxPopulation) {
      errors.push(`Population exceeds ${this.data.currentEra} cap; clamped to ${maxPopulation}`);
      this.data.resources.population = maxPopulation;
    }

    // Validate workers
    Object.entries(this.data.workers).forEach(([worker, count]) => {
      const clamped = Math.floor(clampSafeNumber(count, 0));
      if (clamped !== count) {
        errors.push(`Invalid worker count: ${worker} = ${count}`);
        this.data.workers[worker] = clamped;
      }
    });
    this.clampWorkersToPopulation();

    // Validate lifetimeProduced (must be non-negative numbers, monotonic)
    if (this.data.lifetimeProduced) {
      Object.entries(this.data.lifetimeProduced).forEach(([resource, value]) => {
        const clamped = clampSafeNumber(value, 0);
        if (clamped !== value) {
          errors.push(`Invalid lifetimeProduced: ${resource} = ${value}`);
          this.data.lifetimeProduced[resource] = clamped;
        }
      });
    }

    // Validate progression counters without trusting imported numeric extremes.
    if (!this.data.progression || typeof this.data.progression !== "object" || Array.isArray(this.data.progression)) {
      this.data.progression = initial.progression;
    }
    ["eraProgress", "totalClicks", "totalResources", "totalWorkers", "totalUpgrades"].forEach((key) => {
      const clamped = clampSafeNumber(this.data.progression[key], 0);
      if (clamped !== this.data.progression[key]) {
        errors.push(`Invalid progression value: ${key} = ${this.data.progression[key]}`);
        this.data.progression[key] = clamped;
      }
    });
    if (!Array.isArray(this.data.progression.achievements)) {
      this.data.progression.achievements = [];
    }

    if (!this.data.settings || typeof this.data.settings !== "object" || Array.isArray(this.data.settings)) {
      this.data.settings = { ...initial.settings };
    }
    ["autoSave", "notifications", "soundEnabled", "fastMode"].forEach((key) => {
      if (typeof this.data.settings[key] !== "boolean") {
        this.data.settings[key] = initial.settings[key];
      }
    });

    if (this.data.prestige) {
      ["evolutionPoints", "lifetimeEP", "totalResets"].forEach((key) => {
        const clamped = clampSafeNumber(this.data.prestige[key], 0);
        if (clamped !== this.data.prestige[key]) {
          errors.push(`Invalid prestige value: ${key} = ${this.data.prestige[key]}`);
          this.data.prestige[key] = clamped;
        }
      });
      this.data.prestige.highestEra = this.normalizeEraKey(this.data.prestige.highestEra);
      if (!Array.isArray(this.data.prestige.purchasedPerks)) {
        this.data.prestige.purchasedPerks = [];
      }
      if (!Array.isArray(this.data.prestige.completedEras)) {
        this.data.prestige.completedEras = [];
      }
    }

    if (errors.length > 0) {
      console.warn("Game state validation errors:", errors);
    }

    return errors.length === 0;
  }

  /**
   * Save game state to localStorage
   */
  save() {
    try {
      this.compactRunState();
      const saveData = {
        ...this.data,
        lastSave: Date.now(),
      };

      localStorage.setItem(config.storage.saveKey, JSON.stringify(saveData));
      this.lastSave = Date.now();
      return true;
    } catch (error) {
      console.error("Failed to save game:", error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  load() {
    try {
      const saveData = localStorage.getItem(config.storage.saveKey);
      if (!saveData) return false;

      const parsedData = JSON.parse(saveData);
      return this.loadParsedSave(parsedData);
    } catch (error) {
      console.error("Failed to load game:", error);
      return false;
    }
  }

  /**
   * Load an already-parsed save object after migrating and sanitizing it.
   */
  loadParsedSave(parsedData) {
    if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
      throw new Error("Save data must be an object");
    }

    const initial = this.createInitialState();

    // Shallow merge top-level known fields only. Unknown import keys are ignored
    // so malformed saves cannot persist arbitrary object shapes.
    this.data = {
      ...initial,
      schemaVersion: parsedData.schemaVersion,
      currentEra: parsedData.currentEra,
      gameStartTime: parsedData.gameStartTime,
      totalPlayTime: parsedData.totalPlayTime,
      lastSave: parsedData.lastSave,
    };

    // Deep-merge critical nested objects to preserve default keys. Resources
    // are intentionally sparse; absent saved resources should stay absent
    // instead of resurrecting starter resources after reload.
    this.data.resources = parsedData.resources && typeof parsedData.resources === "object" && !Array.isArray(parsedData.resources)
      ? { ...parsedData.resources }
      : { ...initial.resources };
    this.data.workers = parsedData.workers && typeof parsedData.workers === "object" && !Array.isArray(parsedData.workers)
      ? { ...initial.workers, ...parsedData.workers }
      : { ...initial.workers };
    this.data.upgrades = parsedData.upgrades && typeof parsedData.upgrades === "object" && !Array.isArray(parsedData.upgrades)
      ? { ...initial.upgrades, ...parsedData.upgrades }
      : { ...initial.upgrades };
    this.data.progression = parsedData.progression && typeof parsedData.progression === "object" && !Array.isArray(parsedData.progression)
      ? { ...initial.progression, ...parsedData.progression }
      : { ...initial.progression };
    this.data.settings = parsedData.settings && typeof parsedData.settings === "object" && !Array.isArray(parsedData.settings)
      ? { ...initial.settings, ...parsedData.settings }
      : { ...initial.settings };

    // lifetimeProduced: merge defaults with saved values. for old saves
    // that lack it, seed with current resource amounts so prestige math
    // still works (best-effort migration).
    this.data.lifetimeProduced = parsedData.lifetimeProduced && typeof parsedData.lifetimeProduced === "object" && !Array.isArray(parsedData.lifetimeProduced)
      ? { ...parsedData.lifetimeProduced }
      : {};
    if (!parsedData.lifetimeProduced) {
      Object.entries(this.data.resources).forEach(([r, v]) => {
        if (v > 0 && (this.data.lifetimeProduced[r] || 0) < v) {
          this.data.lifetimeProduced[r] = v;
        }
      });
    }
    if (parsedData.prestige && typeof parsedData.prestige === "object" && !Array.isArray(parsedData.prestige)) {
      this.data.prestige = {
        ...parsedData.prestige,
        purchasedPerks: Array.isArray(parsedData.prestige.purchasedPerks)
          ? [...parsedData.prestige.purchasedPerks]
          : [],
        completedEras: Array.isArray(parsedData.prestige.completedEras)
          ? [...parsedData.prestige.completedEras]
          : [],
      };
    }
    if (parsedData.eraSpecializations && typeof parsedData.eraSpecializations === "object" && !Array.isArray(parsedData.eraSpecializations)) {
      this.data.eraSpecializations = { ...parsedData.eraSpecializations };
    }
    if (parsedData.civSpecializations && typeof parsedData.civSpecializations === "object" && !Array.isArray(parsedData.civSpecializations)) {
      this.data.civSpecializations = { ...parsedData.civSpecializations };
    }
    if (parsedData.tradeRoutes && typeof parsedData.tradeRoutes === "object" && !Array.isArray(parsedData.tradeRoutes)) {
      this.data.tradeRoutes = {
        activeRoutes: Array.isArray(parsedData.tradeRoutes.activeRoutes)
          ? [...parsedData.tradeRoutes.activeRoutes]
          : [],
        routeProgress: parsedData.tradeRoutes.routeProgress && typeof parsedData.tradeRoutes.routeProgress === "object" && !Array.isArray(parsedData.tradeRoutes.routeProgress)
          ? { ...parsedData.tradeRoutes.routeProgress }
          : {},
      };
    }
    if (parsedData.wonders && typeof parsedData.wonders === "object" && !Array.isArray(parsedData.wonders)) {
      this.data.wonders = {
        built: Array.isArray(parsedData.wonders.built) ? [...parsedData.wonders.built] : [],
      };
    }

    // Migrate legacy save structures to current model
    this.migrateLegacySave(parsedData);
    this.releaseWorkersOutsideEra(this.data.currentEra, { notify: false });

    // Validate loaded state
    this.validate();
    this.compactRunState();

    this.notifyListeners("gameLoaded", this.data);

    return true;
  }

  /**
   * Migrate older save formats to current schema, preserving player progress
   */
  migrateLegacySave(parsedData) {
    if (!parsedData || typeof parsedData !== "object") return;

    // 1) unlockedUpgrades array -> boolean flags in upgrades
    if (Array.isArray(parsedData.unlockedUpgrades)) {
      parsedData.unlockedUpgrades.forEach((upgradeId) => {
        if (upgradeId && this.data.upgrades.hasOwnProperty(upgradeId)) {
          this.data.upgrades[upgradeId] = true;
        }
      });
      // Drop legacy field to avoid confusion
      delete this.data.unlockedUpgrades;
    }

    // 2) Workers: legacy 'forager' -> current 'gatherer'
    if (parsedData.workers && typeof parsedData.workers.forager === "number") {
      const count = parsedData.workers.forager;
      this.data.workers.gatherer = (this.data.workers.gatherer || 0) + count;
      // Remove legacy worker field if present
      if (this.data.workers.forager !== undefined)
        delete this.data.workers.forager;
    }

    // 3) Resources: legacy rawMeat -> meat; hide -> fur
    if (parsedData.resources) {
      const r = parsedData.resources;
      if (typeof r.rawMeat === "number" && r.rawMeat > 0) {
        this.data.resources.meat = (this.data.resources.meat || 0) + r.rawMeat;
        if (this.data.resources.rawMeat !== undefined)
          delete this.data.resources.rawMeat;
      }
      if (typeof r.hide === "number" && r.hide > 0) {
        this.data.resources.fur = (this.data.resources.fur || 0) + r.hide;
        if (this.data.resources.hide !== undefined)
          delete this.data.resources.hide;
      }
    }

    // 4) Eras: map legacy keys to current era ids
    const sourceEra = parsedData.currentEra || this.data.currentEra;
    this.data.currentEra = this.normalizeEraKey(sourceEra);
  }

  /**
   * Reset game state to initial values (called on prestige)
   * Wonders persist through prestige as permanent achievements
   */
  reset(options = {}) {
    const { preserveWonders = true } = options;
    const preservedWonders = preserveWonders && this.data.wonders
      ? { built: [...(this.data.wonders.built || [])] }
      : { built: [] };

    this.data = this.createInitialState();
    this.data.eraSpecializations = {};
    this.data.civSpecializations = {};
    this.data.tradeRoutes = { activeRoutes: [], routeProgress: {} };
    this.data.wonders = preservedWonders;

    this.notifyListeners("gameReset", this.data);
  }

  /**
   * Drop inert zero entries from sparse run-state containers.
   */
  compactRunState() {
    Object.entries(this.data.resources || {}).forEach(([resource, value]) => {
      if (!Number.isFinite(value) || value <= 0) {
        delete this.data.resources[resource];
      }
    });

    Object.entries(this.data.workers || {}).forEach(([worker, count]) => {
      if (!Number.isFinite(count) || count <= 0) {
        delete this.data.workers[worker];
      }
    });

    Object.entries(this.data.lifetimeProduced || {}).forEach(([resource, value]) => {
      if (!Number.isFinite(value) || value <= 0) {
        delete this.data.lifetimeProduced[resource];
      }
    });
  }

  /**
   * Get game statistics
   */
  getStatistics() {
    const totalResources = Object.values(this.data.resources).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalWorkers = Object.values(this.data.workers).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalUpgrades = Object.values(this.data.upgrades).filter(
      Boolean,
    ).length;

    return {
      totalResources,
      totalWorkers,
      totalUpgrades,
      currentEra: this.data.currentEra,
      playTime: this.data.totalPlayTime,
    };
  }
}
