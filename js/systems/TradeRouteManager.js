/**
 * TradeRouteManager - Manages trade route mechanics
 * Trade routes unlock cross-civilization technologies and provide passive bonuses
 */

import { config } from "../core/config.js";

export class TradeRouteManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.gameManager = null;
    this.routeTimers = new Map();
  }

  setGameManager(gm) {
    this.gameManager = gm;
  }

  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  /**
   * Initialize trade routes from saved state
   */
  initialize() {
    if (!this.gameState.data.tradeRoutes) {
      this.gameState.data.tradeRoutes = { activeRoutes: [], routeProgress: {} };
    }

    // restart production timers for active routes
    const activeRoutes = this.gameState.data.tradeRoutes.activeRoutes || [];
    activeRoutes.forEach((routeId) => {
      this.startRouteProduction(routeId);
    });
  }

  /**
   * Check if a trade route can be unlocked
   */
  canUnlockRoute(routeId) {
    const route = config.tradeRoutes[routeId];
    if (!route) return { canUnlock: false, reason: "Route not found" };

    // check if already active
    const activeRoutes = this.gameState.data.tradeRoutes?.activeRoutes || [];
    if (activeRoutes.includes(routeId)) {
      return { canUnlock: false, reason: "Route already established" };
    }

    // check era requirement
    const currentEra = this.gameState.data.currentEra;
    const eraOrder = config.eraOrder;
    const currentEraIdx = eraOrder.indexOf(currentEra);
    const requiredEraIdx = eraOrder.indexOf(route.unlockEra);

    if (currentEraIdx < requiredEraIdx) {
      return {
        canUnlock: false,
        reason: `Requires ${config.eras[route.unlockEra]?.name || route.unlockEra}`,
      };
    }

    // check civilization requirement (if any)
    if (route.unlockCivs && route.unlockCivs.length > 0) {
      const civSpecs = this.gameState.data.civSpecializations || {};
      const hasCiv = Object.values(civSpecs).some((civ) =>
        route.unlockCivs.includes(civ)
      );
      if (!hasCiv) {
        return {
          canUnlock: false,
          reason: `Requires civilization: ${route.unlockCivs.join(" or ")}`,
        };
      }
    }

    // check cost
    if (!this.gameState.canAfford(route.cost)) {
      return { canUnlock: false, reason: "Cannot afford" };
    }

    return { canUnlock: true };
  }

  /**
   * Establish a trade route
   */
  establishRoute(routeId) {
    const { canUnlock, reason } = this.canUnlockRoute(routeId);
    if (!canUnlock) {
      this.gameManager?.showNotification(reason, "error");
      return false;
    }

    const route = config.tradeRoutes[routeId];

    // spend cost
    this.gameState.spendResources(route.cost);

    // add to active routes
    if (!this.gameState.data.tradeRoutes) {
      this.gameState.data.tradeRoutes = { activeRoutes: [], routeProgress: {} };
    }
    this.gameState.data.tradeRoutes.activeRoutes.push(routeId);

    // start production
    this.startRouteProduction(routeId);

    // notify
    this.gameManager?.showNotification(
      `Established ${route.name}! ${route.description}`,
      "success",
      5000
    );

    // emit event for store sync
    this.gameState.notifyListeners("tradeRouteEstablished", { routeId, route });

    return true;
  }

  /**
   * Start passive production for a trade route
   */
  startRouteProduction(routeId) {
    const route = config.tradeRoutes[routeId];
    if (!route || !route.produces) return;

    // stop existing timer if any
    if (this.routeTimers.has(routeId)) {
      clearInterval(this.routeTimers.get(routeId));
    }

    // produce every 10 seconds
    const interval = setInterval(() => {
      if (!this.isRouteActive(routeId)) {
        clearInterval(interval);
        this.routeTimers.delete(routeId);
        return;
      }

      Object.entries(route.produces).forEach(([resource, amount]) => {
        this.gameState.addResource(resource, amount);
      });
    }, 10000);

    this.routeTimers.set(routeId, interval);
  }

  /**
   * Check if a route is active
   */
  isRouteActive(routeId) {
    return (
      this.gameState.data.tradeRoutes?.activeRoutes?.includes(routeId) || false
    );
  }

  /**
   * Get bonus multiplier for a resource from all active trade routes
   */
  getRouteMultiplier(resource) {
    let multiplier = 1.0;

    const activeRoutes = this.gameState.data.tradeRoutes?.activeRoutes || [];
    activeRoutes.forEach((routeId) => {
      const route = config.tradeRoutes[routeId];
      if (route?.bonuses?.[resource]) {
        multiplier *= route.bonuses[resource];
      }
    });

    return multiplier;
  }

  /**
   * Get list of available (unlockable) routes for current game state
   */
  getAvailableRoutes() {
    const available = [];
    const currentEra = this.gameState.data.currentEra;
    const eraOrder = config.eraOrder;
    const currentEraIdx = eraOrder.indexOf(currentEra);

    Object.entries(config.tradeRoutes).forEach(([routeId, route]) => {
      const requiredEraIdx = eraOrder.indexOf(route.unlockEra);
      if (currentEraIdx >= requiredEraIdx) {
        const { canUnlock, reason } = this.canUnlockRoute(routeId);
        available.push({
          ...route,
          id: routeId,
          canUnlock,
          reason: canUnlock ? null : reason,
          isActive: this.isRouteActive(routeId),
        });
      }
    });

    return available;
  }

  /**
   * Get all active routes with their details
   */
  getActiveRoutes() {
    const activeRoutes = this.gameState.data.tradeRoutes?.activeRoutes || [];
    return activeRoutes.map((routeId) => ({
      id: routeId,
      ...config.tradeRoutes[routeId],
    }));
  }

  /**
   * Reset trade routes (called on prestige)
   */
  reset() {
    // stop all timers
    this.routeTimers.forEach((timer) => clearInterval(timer));
    this.routeTimers.clear();

    // reset state
    this.gameState.data.tradeRoutes = { activeRoutes: [], routeProgress: {} };
  }

  /**
   * Stop all production timers
   */
  destroy() {
    this.routeTimers.forEach((timer) => clearInterval(timer));
    this.routeTimers.clear();
  }
}
