/**
 * UI Manager - Handles all user interface updates and interactions
 */

import { config } from "../core/config.js";

export class UIManager {
  constructor(gameState, gameManager) {
    this.gameState = gameState;
    this.gameManager = gameManager;

    this.cacheElements();

    // Create action buttons if container exists
    if (this.elements.actionButtonsContainer) {
      this.createActionButtons();
    }

    this.addEventListeners();
    this.initLogMenu();

    // Initial UI update
    this.updateUI();
  }

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements = {
      // Action buttons
      actionButtonsContainer: document.getElementById(
        "action-buttons-container",
      ),

      // Resource display
      resourceDisplay: document.getElementById("resource-display"),

      // Era display
      currentEraName: document.getElementById("current-era-name"),
      eraProgress: document.getElementById("era-progress"),
      nextEraButton: document.getElementById("next-era-button"),

      // Workers
      workersContainer: document.getElementById("workers-container"),
      workerStatus: document.getElementById("worker-status"),

      // Upgrades
      upgradesContainer: document.getElementById("upgrades"),

      // Logs
      logMenu: document.getElementById("log-menu"),
      logToggle: document.getElementById("log-toggle"),
      eventLog: document.getElementById("event-log"),
      disasterLog: document.getElementById("disaster-log"),

      // Save controls
      saveButton: document.getElementById("save-button"),
      exportButton: document.getElementById("export-button"),
      importButton: document.getElementById("import-button"),
      resetButton: document.getElementById("reset-button"),

      // Achievements
      achievementsContainer: document.getElementById("achievements-container"),
      achievementCount: document.getElementById("achievement-count"),

      // Prestige
      prestigeEP: document.getElementById("prestige-ep"),
      prestigeMultiplier: document.getElementById("prestige-multiplier"),
      prestigeResets: document.getElementById("prestige-resets"),
      prestigeGain: document.getElementById("prestige-gain"),
      prestigeButton: document.getElementById("prestige-button"),

      // Notifications
      notificationContainer: document.getElementById("notification-container"),
    };
  }

  /**
   * Build action buttons from current era config
   */
  createActionButtons() {
    const currentEraData = this.gameManager.getCurrentEraData();
    const actions = currentEraData?.actions || [];

    this.elements.actionButtonsContainer.innerHTML = actions.map(action => {
      const hidden = action.requiresUpgrade && !this.gameState.hasUpgrade(action.requiresUpgrade) ? ' d-none' : '';
      return `
        <button id="action-${action.id}" class="btn btn-ghost w-100 d-flex align-items-center gap-2${hidden}" title="${action.description}" data-action-id="${action.id}">
          <span class="button-icon">${action.icon}</span>
          <span class="button-text text-start">
            <span class="button-title fw-semibold">${action.name}</span>
            <span class="button-desc d-block small" style="color: var(--text-muted)">${action.description}</span>
          </span>
        </button>
      `;
    }).join('');

    // track which era we built buttons for
    this._actionButtonsEra = this.gameState.data.currentEra;

    // attach click handlers
    actions.forEach(action => {
      const btn = document.getElementById(`action-${action.id}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.gameManager.performAction(
            btn,
            () => this.gameManager.doClickAction(action),
            action.cooldown || 1000,
          );
        });
      }
    });
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    // action button listeners are attached in createActionButtons()

    // Era advancement
    if (this.elements.nextEraButton) {
      this.elements.nextEraButton.addEventListener("click", () => {
        this.gameManager.advanceEra();
      });
    }

    // Save controls
    if (this.elements.saveButton) {
      this.elements.saveButton.addEventListener("click", () =>
        this.gameManager.saveGame(),
      );
    }
    if (this.elements.exportButton) {
      this.elements.exportButton.addEventListener("click", () =>
        this.gameManager.exportSave(),
      );
    }
    if (this.elements.importButton) {
      this.elements.importButton.addEventListener("click", () => {
        const encoded = prompt("Paste your exported save data:");
        if (encoded) this.gameManager.importSave(encoded);
      });
    }
    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener("click", () =>
        this.gameManager.resetGame(),
      );
    }

    // Prestige
    if (this.elements.prestigeButton) {
      this.elements.prestigeButton.addEventListener("click", () =>
        this.gameManager.performPrestige(),
      );
    }

    // Log toggle
    if (this.elements.logToggle) {
      this.elements.logToggle.addEventListener("click", () => {
        this.toggleLogMenu();
      });
    }
  }

  /**
   * Initialize log menu
   */
  initLogMenu() {
    // log menu starts hidden via d-none in HTML
  }

  /**
   * Toggle log menu visibility
   */
  toggleLogMenu() {
    if (this.elements.logMenu) {
      this.elements.logMenu.classList.toggle("d-none");
    }
  }

  /**
   * Main UI update method
   */
  updateUI() {
    this.updateResources();
    this.updateEraDisplay();
    this.updateActionButtons();
    this.updateWorkers();
    this.updateUpgrades();
    this.updateEraProgression();
    this.updateAchievements();
    this.updatePrestige();
  }

  /**
   * Update resource display
   */
  updateResources() {
    if (!this.elements.resourceDisplay) return;

    const gameData = this.gameState.getState();
    const resources = gameData.resources;

    this.elements.resourceDisplay.innerHTML = Object.entries(resources)
      .filter(([key, value]) => value > 0 && key !== "fire")
      .map(
        ([key, value]) => `
        <div class="resource-item d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <span class="resource-icon">${config.resourceIcons[key] || "❓"}</span>
            <span class="resource-name">${this.formatResourceName(key)}</span>
          </div>
          <span style="color: var(--text-secondary); font-variant-numeric: tabular-nums;" data-amount="${Math.floor(value)}">${this.formatNumber(Math.floor(value))}</span>
        </div>
      `,
      )
      .join("");

    // Optional: subtle animation hook remains
    this.animateResourceChanges();
  }

  /**
   * Format resource names for better display
   */
  formatResourceName(key) {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }

  /**
   * Format numbers with appropriate suffixes
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  /**
   * Animate resource changes
   */
  animateResourceChanges() {
    const resourceElements =
      this.elements.resourceDisplay.querySelectorAll(".resource-item");
    resourceElements.forEach((element, index) => {
      element.style.animationDelay = `${index * 50}ms`;
      element.classList.add("resource-fade-in");
    });
  }

  /**
   * Update era display
   */
  updateEraDisplay() {
    const currentEraData = this.gameManager.getCurrentEraData();

    if (this.elements.currentEraName && currentEraData) {
      // Show era name and timespan
      const eraText = currentEraData.timespan
        ? `${currentEraData.name} (${currentEraData.timespan})`
        : currentEraData.name;
      this.elements.currentEraName.textContent = eraText;

      // Add era description as tooltip
      if (currentEraData.description) {
        this.elements.currentEraName.title = currentEraData.description;
      }
    }
  }
  /**
   * Update action buttons - rebuild on era change, toggle visibility by upgrade
   */
  updateActionButtons() {
    if (!this.elements.actionButtonsContainer) return;

    const currentEra = this.gameState.data.currentEra;

    // rebuild buttons when era changes
    if (this._actionButtonsEra !== currentEra) {
      this.createActionButtons();
      return;
    }

    // toggle visibility based on upgrade requirements and resource availability
    const currentEraData = this.gameManager.getCurrentEraData();
    const actions = currentEraData?.actions || [];

    for (const action of actions) {
      const btn = document.getElementById(`action-${action.id}`);
      if (!btn) continue;

      if (action.requiresUpgrade) {
        const unlocked = this.gameState.hasUpgrade(action.requiresUpgrade);
        btn.classList.toggle('d-none', !unlocked);
      }

      // disable if missing consumable resources
      if (action.consumes && !btn.disabled) {
        const canAfford = this.gameState.canAfford(action.consumes);
        btn.style.opacity = canAfford ? '' : '0.5';
      }
    }
  }

  /**
   * Update workers display
   */
  updateWorkers() {
    if (!this.elements.workersContainer) return;

    const gameData = this.gameState.getState();
    const currentEraData = this.gameManager.getCurrentEraData();
    if (!currentEraData || !currentEraData.workers) return;

    this.elements.workersContainer.innerHTML = currentEraData.workers
      .map((worker) => {
        const workerInfo = this.gameManager.systems.workerManager.getWorkerInfo(worker.id);
        const workerCount = workerInfo?.count || 0;
        const actualCost = workerInfo?.cost || worker.cost;
        const canAfford = this.gameState.canAfford(actualCost);
        const hasRequiredUpgrade = workerInfo?.requirementMet ?? true;
        const canHire = canAfford && hasRequiredUpgrade;

        let statusText = "";
        if (!hasRequiredUpgrade) {
          statusText = `<span class="small" style="color: var(--warning)">Requires: ${worker.requiresUpgrade}</span>`;
        } else if (!canAfford) {
          statusText = `<span class="small" style="color: var(--text-muted)">Need more resources</span>`;
        }

        // show efficiency % and food status for owned workers
        let efficiencyBadge = "";
        if (workerCount > 0 && workerInfo) {
          const eff = workerInfo.efficiencyPct || 100;
          const foodStatus = workerInfo.foodStatus || 'wellFed';
          const foodColor = foodStatus === 'wellFed' ? 'var(--success)' : foodStatus === 'hungry' ? 'var(--warning)' : 'var(--error)';
          efficiencyBadge = `<span class="small" style="color: ${foodColor}">${eff}% eff</span>`;
        }

        return `
					<div class="col">
						<div class="worker-item ${!hasRequiredUpgrade ? "opacity-50" : ""}">
							<div class="d-flex flex-column">
								<h4 class="h6 mb-1">${worker.name}</h4>
								<p class="small mb-2" style="color: var(--text-muted)">${worker.description}</p>
								<p class="small mb-1" style="color: var(--text-muted)">Cost: ${this.formatCost(actualCost)}</p>
								<p class="small mb-2" style="color: var(--text-muted)">Owned: ${workerCount} ${efficiencyBadge}</p>
								<div class="mt-auto d-flex justify-content-between align-items-center">
									${statusText}
									<button class="hire-button btn btn-sm ${canHire ? "btn-primary" : "btn-secondary"}" data-worker-type="${worker.id}" ${!canHire ? "disabled" : ""}>
										${!hasRequiredUpgrade ? "Locked" : "Hire"}
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
      })
      .join("");

    this.elements.workersContainer
      .querySelectorAll(".hire-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const workerType = button.dataset.workerType;
          this.gameManager.hireWorker(workerType);
        });
      });

    this.updateWorkerStatus();
  }

  /**
   * Update worker status display
   */
  updateWorkerStatus() {
    if (!this.elements.workerStatus) return;

    const gameData = this.gameState.getState();
    const workers = gameData.workers;

    const workerStatusText = Object.entries(workers)
      .filter(([_, count]) => count > 0)
      .map(
        ([type, count]) =>
          `${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`,
      )
      .join(", ");

    this.elements.workerStatus.textContent =
      workerStatusText || "No workers hired";
  }

  /**
   * Update upgrades display
   */
  updateUpgrades() {
    if (!this.elements.upgradesContainer) return;
    const currentEraData = this.gameManager.getCurrentEraData();
    if (!currentEraData || !currentEraData.upgrades) return;

    this.elements.upgradesContainer.innerHTML = currentEraData.upgrades
      .map((upgrade) => {
        const isUnlocked = this.gameState.hasUpgrade(upgrade.id);
        const canAfford = !isUnlocked && this.gameState.canAfford(upgrade.cost);
        const hasRequiredUpgrade =
          !upgrade.requiresUpgrade ||
          this.gameState.hasUpgrade(upgrade.requiresUpgrade);
        const canBuy = !isUnlocked && canAfford && hasRequiredUpgrade;
        const cardState = isUnlocked ? "purchased" : canBuy ? "affordable" : "";

        const historicalInfo = upgrade.historical
          ? `<p class="small mb-0" style="color: var(--text-muted)">${upgrade.historical}</p>`
          : "";
        const requirementInfo = !hasRequiredUpgrade
          ? `<p class="small mb-1" style="color: var(--warning)">Requires: ${upgrade.requiresUpgrade}</p>`
          : "";

        return `
					<div class="col">
						<div class="upgrade-item ${cardState}">
							<div class="d-flex flex-column">
								<h4 class="h6 mb-1">${upgrade.name}</h4>
								<p class="small mb-2" style="color: var(--text-muted)">${upgrade.description}</p>
								<p class="small mb-1" style="color: var(--text-muted)">Cost: ${this.formatCost(upgrade.cost)}</p>
								<p class="small mb-2" style="color: var(--text-muted)">Effect: ${upgrade.effect}</p>
								${requirementInfo}
								${historicalInfo}
								<div class="mt-auto">
									<button class="upgrade-button btn btn-sm ${isUnlocked ? "btn-success" : canBuy ? "btn-primary" : "btn-secondary"}" data-upgrade-id="${upgrade.id}" ${isUnlocked || !canBuy ? "disabled" : ""}>
										${isUnlocked ? "Purchased" : "Buy"}
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
      })
      .join("");

    this.elements.upgradesContainer
      .querySelectorAll(".upgrade-button")
      .forEach((button) => {
        if (!button.disabled) {
          button.addEventListener("click", () => {
            const upgradeId = button.dataset.upgradeId;
            this.gameManager.buyUpgrade(upgradeId);
          });
        }
      });
  }

  /**
   * Update era progression display and advancement button
   */
  updateEraProgression() {
    const currentEra = this.gameState.data.currentEra;
    const eraData = this.gameManager.getCurrentEraData();
    const canAdvance = this.gameState.canAdvanceEra();

    // calculate progress as average fulfillment of advancementCost
    let progressPercent = 0;
    if (eraData?.advancementCost) {
      const entries = Object.entries(eraData.advancementCost);
      const fulfillments = entries.map(([resource, required]) => {
        const current = this.gameState.getResource(resource);
        return Math.min(1, current / required);
      });
      progressPercent =
        (fulfillments.reduce((a, b) => a + b, 0) / fulfillments.length) * 100;
    } else {
      progressPercent = 100;
    }

    // update all progress bars (sidebar + top bar)
    document.querySelectorAll(".progress-bar").forEach((bar) => {
      if (bar.closest("#cutscene-container")) return;
      bar.style.width = `${progressPercent.toFixed(1)}%`;
    });

    // update progress text
    const progressText = document.querySelector(".progress-text");
    if (progressText) {
      if (eraData?.advancementCost) {
        const costText = Object.entries(eraData.advancementCost)
          .map(
            ([r, amt]) =>
              `${Math.floor(this.gameState.getResource(r))}/${amt} ${r}`,
          )
          .join(", ");
        progressText.textContent = costText;
      } else {
        progressText.textContent = "Final era reached";
      }
    }

    // update advance button
    if (!this.elements.nextEraButton) return;
    this.elements.nextEraButton.disabled = !canAdvance;
    this.elements.nextEraButton.classList.toggle("btn-success", canAdvance);
    this.elements.nextEraButton.classList.toggle("btn-secondary", !canAdvance);
    this.elements.nextEraButton.classList.remove("d-none");
    this.elements.nextEraButton.textContent = canAdvance
      ? "Advance Era"
      : "Advance Era (requirements not met)";
    this.elements.nextEraButton.classList.toggle("affordable", canAdvance);
  }

  /**
   * Format cost object for display
   */
  formatCost(cost) {
    return Object.entries(cost)
      .map(
        ([resource, amount]) =>
          `${amount} ${config.resourceIcons[resource] || resource}`,
      )
      .join(", ");
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = "success", duration = 2000) {
    // Reduced default from 3000 to 2000
    if (!this.elements.notificationContainer) return;

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    this.elements.notificationContainer.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add("show"), 10);

    // Remove notification
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * Log an event
   */
  logEvent(event) {
    if (!this.elements.eventLog) return;

    const effectText = event.effect
      ? Object.entries(event.effect)
          .map(
            ([resource, change]) =>
              `${change > 0 ? "+" : ""}${(change * 100).toFixed(0)}% ${resource}`,
          )
          .join(", ")
      : "";

    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.innerHTML = `
      <h4>${event.name}</h4>
      <p>${event.description}</p>
      ${effectText ? `<p class="small text-secondary">Effect: ${effectText}</p>` : ""}
      <small>${new Date().toLocaleTimeString()}</small>
    `;

    this.elements.eventLog.prepend(logEntry);
  }

  /**
   * Log a disaster
   */
  logDisaster(disaster) {
    if (!this.elements.disasterLog) return;

    const effectText = disaster.effect
      ? Object.entries(disaster.effect)
          .map(
            ([resource, change]) =>
              `${change > 0 ? "+" : ""}${(change * 100).toFixed(0)}% ${resource}`,
          )
          .join(", ")
      : "";

    const logEntry = document.createElement("div");
    logEntry.className = "log-entry disaster";
    logEntry.innerHTML = `
      <h4>${disaster.name}</h4>
      <p>${disaster.description}</p>
      ${effectText ? `<p class="small text-secondary">Effect: ${effectText}</p>` : ""}
      <small>${new Date().toLocaleTimeString()}</small>
    `;

    this.elements.disasterLog.prepend(logEntry);
  }

  /**
   * Update achievements display
   */
  updateAchievements() {
    const am = this.gameManager.systems.achievementManager;
    if (!am || !this.elements.achievementsContainer) return;

    const all = am.getAllAchievements();

    if (this.elements.achievementCount) {
      this.elements.achievementCount.textContent = `${am.getUnlockedCount()} / ${am.getTotalCount()}`;
    }

    this.elements.achievementsContainer.innerHTML = all
      .map(
        (a) => `
				<div class="col">
					<div class="d-flex align-items-center gap-2 p-2 rounded ${a.unlocked ? "" : "opacity-50"}" style="background: var(--bg-elevated)">
						<span class="fs-5">${a.unlocked ? a.icon : "🔒"}</span>
						<div>
							<div class="small fw-semibold">${a.unlocked ? a.name : "???"}</div>
							<div class="small" style="color: var(--text-muted)">${a.unlocked ? a.description : "Locked"}</div>
						</div>
					</div>
				</div>
			`,
      )
      .join("");
  }

  /**
   * Update prestige panel
   */
  updatePrestige() {
    const pm = this.gameManager.systems.prestigeManager;
    if (!pm) return;

    const prestige = pm.getPrestigeData();
    const canPrestige = pm.canPrestige();
    const epGain = pm.calculateEPGain();

    if (this.elements.prestigeEP) {
      this.elements.prestigeEP.textContent = prestige.evolutionPoints;
    }
    if (this.elements.prestigeMultiplier) {
      this.elements.prestigeMultiplier.textContent =
        pm.getMultiplier().toFixed(1) + "x";
    }
    if (this.elements.prestigeResets) {
      this.elements.prestigeResets.textContent = prestige.totalResets;
    }
    if (this.elements.prestigeGain) {
      this.elements.prestigeGain.textContent = `+${epGain}`;
    }
    if (this.elements.prestigeButton) {
      this.elements.prestigeButton.disabled = !canPrestige;
      this.elements.prestigeButton.textContent = canPrestige
        ? `Prestige (+${epGain} EP)`
        : "Prestige (reach Neolithic)";
      this.elements.prestigeButton.classList.toggle("btn-primary", canPrestige);
      this.elements.prestigeButton.classList.toggle("btn-ghost", !canPrestige);
    }

    // render talent tree
    this.renderTalentTree(pm);

    // render era specializations
    this.renderSpecializations();
  }

  /**
   * Render prestige talent tree
   */
  renderTalentTree(pm) {
    const container = document.getElementById('talent-tree-container');
    if (!container) return;

    const tree = pm.getTalentTree();
    if (tree.length === 0) {
      container.innerHTML = '<p class="small" style="color: var(--text-muted)">Prestige to unlock talents</p>';
      return;
    }

    // group by tier
    const tiers = {};
    tree.forEach(perk => {
      if (!tiers[perk.tier]) tiers[perk.tier] = [];
      tiers[perk.tier].push(perk);
    });

    const tierNames = { 1: 'Early Game', 2: 'Growth', 3: 'Cost Reduction', 4: 'Advanced', 5: 'Endgame' };

    container.innerHTML = Object.entries(tiers)
      .sort(([a], [b]) => a - b)
      .map(([tier, perks]) => `
        <div class="mb-3">
          <h6 class="small fw-semibold mb-2" style="color: var(--text-secondary)">Tier ${tier}: ${tierNames[tier] || ''}</h6>
          <div class="row row-cols-1 row-cols-md-2 g-2">
            ${perks.map(perk => {
              const btnClass = perk.purchased ? 'btn-success' : perk.available ? 'btn-primary' : 'btn-secondary';
              const btnText = perk.purchased ? 'Owned' : `${perk.cost} EP`;
              const disabled = perk.purchased || !perk.available ? 'disabled' : '';
              return `
                <div class="col">
                  <div class="p-2 rounded d-flex justify-content-between align-items-start" style="background: var(--bg-elevated); ${perk.purchased ? 'border-left: 3px solid var(--success)' : ''}">
                    <div>
                      <div class="small fw-semibold">${perk.name}</div>
                      <div class="small" style="color: var(--text-muted)">${perk.description}</div>
                    </div>
                    <button class="btn btn-sm ${btnClass} ms-2 perk-buy-btn" data-perk-id="${perk.id}" ${disabled} style="white-space: nowrap">
                      ${btnText}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('');

    // attach buy handlers
    container.querySelectorAll('.perk-buy-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', () => {
          const perkId = btn.dataset.perkId;
          if (pm.purchasePerk(perkId)) {
            this.showNotification('Perk purchased!', 'success');
            this.updatePrestige();
          }
        });
      }
    });
  }

  /**
   * Render era specialization choices
   */
  renderSpecializations() {
    const container = document.getElementById('specialization-container');
    if (!container) return;

    const currentEra = this.gameState.data.currentEra;
    const specs = config.eraSpecializations?.[currentEra];

    if (!specs || specs.length === 0) {
      container.innerHTML = '';
      return;
    }

    const chosen = this.gameState.data.eraSpecializations?.[currentEra];

    container.innerHTML = `
      <h6 class="small fw-semibold mb-2" style="color: var(--text-secondary)">Era Specialization (choose one)</h6>
      <div class="row row-cols-1 row-cols-md-3 g-2">
        ${specs.map(spec => {
          const isChosen = chosen === spec.id;
          const isLocked = chosen && !isChosen;
          const btnClass = isChosen ? 'btn-success' : isLocked ? 'btn-secondary' : 'btn-primary';
          const disabled = isChosen || isLocked ? 'disabled' : '';
          return `
            <div class="col">
              <div class="p-2 rounded" style="background: var(--bg-elevated); ${isChosen ? 'border: 2px solid var(--success)' : isLocked ? 'opacity: 0.5' : ''}">
                <div class="small fw-semibold mb-1">${spec.name}</div>
                <div class="small mb-2" style="color: var(--text-muted)">${spec.description}</div>
                <button class="btn btn-sm ${btnClass} spec-choose-btn" data-era="${currentEra}" data-spec-id="${spec.id}" ${disabled}>
                  ${isChosen ? 'Active' : isLocked ? 'Locked' : 'Choose'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.spec-choose-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', () => {
          const era = btn.dataset.era;
          const specId = btn.dataset.specId;
          this.gameManager.chooseSpecialization(era, specId);
        });
      }
    });
  }
}
