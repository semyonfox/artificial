/**
 * UI Manager - Handles all user interface updates and interactions
 */

import { config } from '../core/config.js';

export class UIManager {
	constructor(gameState, gameManager, eraRegistry) {
		this.gameState = gameState;
		this.gameManager = gameManager;
		this.eraRegistry = eraRegistry;

		this.cacheElements();

		// Create action buttons if container exists
		if (this.elements.actionButtonsContainer) {
			this.createActionButtons();
		}

		this.addEventListeners();
		this.initLogMenu();

		// Initial UI update
		this.updateUI();

		console.log('UIManager initialized');
	}

	/**
	 * Cache DOM elements for performance
	 */
	cacheElements() {
		this.elements = {
			// Action buttons
			actionButtonsContainer: document.getElementById(
				'action-buttons-container'
			),

			// Resource display
			resourceDisplay: document.getElementById('resource-display'),

			// Era display
			eraDisplay: document.getElementById('era-display'),
			currentEraName: document.getElementById('current-era-name'),
			eraProgress: document.getElementById('era-progress'),
			nextEraButton: document.getElementById('next-era-button'),

			// Workers
			workersContainer: document.getElementById('workers-container'),
			workerStatus: document.getElementById('worker-status'),

			// Upgrades
			upgradesContainer: document.getElementById('upgrades'),

			// Logs
			logMenu: document.getElementById('log-menu'),
			logToggle: document.getElementById('log-toggle'),
			eventLog: document.getElementById('event-log'),
			disasterLog: document.getElementById('disaster-log'),

			// Notifications
			notificationContainer: document.getElementById('notification-container'),
		};
	}

	/**
	 * Create enhanced action buttons dynamically
	 */
	createActionButtons() {
		this.elements.actionButtonsContainer.innerHTML = `
      <button id="forage-button" class="action-button" title="Gather sticks and stones from the wilderness">
        <span class="button-icon">🪵</span>
        <span class="button-text">
          <span class="button-title">Forage</span>
          <span class="button-desc">Gather sticks</span>
        </span>
      </button>
      <button id="hunt-button" class="action-button hidden" title="Hunt animals for meat and materials">
        <span class="button-icon">🥩</span>
        <span class="button-text">
          <span class="button-title">Hunt</span>
          <span class="button-desc">Find meat</span>
        </span>
      </button>
      <button id="cook-button" class="action-button hidden" title="Cook raw meat to make it more nutritious">
        <span class="button-icon">🍗</span>
        <span class="button-text">
          <span class="button-title">Cook</span>
          <span class="button-desc">Prepare food</span>
        </span>
      </button>
    `;

		// Cache the newly created elements
		this.elements.forageButton = document.getElementById('forage-button');
		this.elements.huntButton = document.getElementById('hunt-button');
		this.elements.cookButton = document.getElementById('cook-button');
	}

	/**
	 * Add event listeners
	 */
	addEventListeners() {
		// Action buttons
		if (this.elements.forageButton) {
			this.elements.forageButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.forageButton,
					() => this.gameManager.forage(),
					1000
				)
			);
		}

		if (this.elements.huntButton) {
			this.elements.huntButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.huntButton,
					() => this.gameManager.findFood(),
					1500
				)
			);
		}

		if (this.elements.cookButton) {
			this.elements.cookButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.cookButton,
					() => this.gameManager.cookMeat(),
					800
				)
			);
		}

		// Era advancement
		if (this.elements.nextEraButton) {
			this.elements.nextEraButton.addEventListener('click', () => {
				this.gameManager.advanceEra();
			});
		}

		// Log toggle
		if (this.elements.logToggle) {
			this.elements.logToggle.addEventListener('click', () => {
				this.toggleLogMenu();
			});
		}
	}

	/**
	 * Initialize log menu
	 */
	initLogMenu() {
		if (this.elements.logMenu) {
			this.elements.logMenu.classList.add('collapsed');
		}
	}

	/**
	 * Toggle log menu visibility
	 */
	toggleLogMenu() {
		if (this.elements.logMenu) {
			this.elements.logMenu.classList.toggle('collapsed');
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
	}

	/**
	 * Update resource display
	 */
	updateResources() {
		if (!this.elements.resourceDisplay) return;

		const gameData = this.gameState.getState();
		const resources = gameData.resources;

		this.elements.resourceDisplay.innerHTML = Object.entries(resources)
			.filter(([_, value]) => value > 0)
			.map(
				([key, value]) => `
        <div class="resource-item" data-resource="${key}">
          <div class="resource-info">
            <span class="resource-icon">${
							config.resourceIcons[key] || '❓'
						}</span>
            <span class="resource-name">${this.formatResourceName(key)}</span>
          </div>
          <span class="resource-amount" data-amount="${Math.floor(
						value
					)}">${this.formatNumber(Math.floor(value))}</span>
        </div>
      `
			)
			.join('');

		// Add animation to newly updated resources
		this.animateResourceChanges();
	}

	/**
	 * Format resource names for better display
	 */
	formatResourceName(key) {
		return key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase());
	}

	/**
	 * Format numbers with appropriate suffixes
	 */
	formatNumber(num) {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}

	/**
	 * Animate resource changes
	 */
	animateResourceChanges() {
		const resourceElements =
			this.elements.resourceDisplay.querySelectorAll('.resource-item');
		resourceElements.forEach((element, index) => {
			element.style.animationDelay = `${index * 50}ms`;
			element.classList.add('resource-fade-in');
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
	 * Update action buttons visibility and state
	 */
	updateActionButtons() {
		const gameData = this.gameState.getState();
		const currentEraData = this.gameManager.getCurrentEraData();

		if (!currentEraData) return;

		// For Paleolithic era
		if (gameData.currentEra === 'paleolithic') {
			// Show/hide hunt button based on stone knapping upgrade
			const hasStoneKnapping =
				gameData.unlockedUpgrades.includes('stoneKnapping');
			const hasFireControl = gameData.unlockedUpgrades.includes('fireControl');

			if (this.elements.huntButton) {
				this.elements.huntButton.classList.toggle('hidden', !hasStoneKnapping);
				if (hasStoneKnapping) {
					// Update button description to show it's unlocked
					const huntDesc =
						this.elements.huntButton.querySelector('.button-desc');
					if (huntDesc) {
						huntDesc.textContent = 'Hunt with stone tools';
					}
				}
			}

			if (this.elements.cookButton) {
				this.elements.cookButton.classList.toggle('hidden', !hasFireControl);

				// Disable cook button if no raw meat or no fire control
				if (hasFireControl) {
					this.elements.cookButton.disabled =
						(gameData.resources.meat || 0) <= 0;

					// Update button description
					const cookDesc =
						this.elements.cookButton.querySelector('.button-desc');
					if (cookDesc) {
						cookDesc.textContent = 'Cook with fire';
					}
				}
			}
		} else {
			// For later eras, hide basic action buttons
			if (this.elements.forageButton) {
				this.elements.forageButton.classList.add('hidden');
			}
			if (this.elements.huntButton) {
				this.elements.huntButton.classList.add('hidden');
			}
			if (this.elements.cookButton) {
				this.elements.cookButton.classList.add('hidden');
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
				const workerCount = gameData.workers[worker.id] || 0;

				// Get actual cost including scaling
				const actualCost =
					this.gameManager.systems.workerManager.calculateWorkerCost(
						worker.cost,
						workerCount
					);
				const canAfford = this.gameState.canAfford(actualCost);
				const hasRequiredUpgrade =
					!worker.requiresUpgrade ||
					gameData.unlockedUpgrades.includes(worker.requiresUpgrade);
				const canHire = canAfford && hasRequiredUpgrade;

				let statusText = '';
				if (!hasRequiredUpgrade) {
					const upgradeName =
						worker.requiresUpgrade === 'woodenSpear'
							? 'Wooden Spear'
							: worker.requiresUpgrade === 'fireControl'
							? 'Fire Control'
							: worker.requiresUpgrade;
					statusText = `<p class="requirement-text">⚠️ Requires: ${upgradeName}</p>`;
				} else if (!canAfford) {
					statusText = `<p class="requirement-text">💰 Need more resources</p>`;
				}

				return `
          <div class="worker-item ${!hasRequiredUpgrade ? 'locked' : ''}">
            <h4>${worker.name}</h4>
            <p class="worker-description">${worker.description}</p>
            <p class="worker-cost">Cost: ${this.formatCost(actualCost)}</p>
            <p class="worker-owned">Owned: ${workerCount}</p>
            ${statusText}
            <button 
              class="hire-button ${canHire ? 'available' : 'unavailable'}" 
              data-worker-type="${worker.id}"
              ${!canHire ? 'disabled' : ''}
            >
              ${!hasRequiredUpgrade ? 'Locked' : `Hire ${worker.name}`}
            </button>
          </div>
        `;
			})
			.join('');

		// Add event listeners to hire buttons
		this.elements.workersContainer
			.querySelectorAll('.hire-button')
			.forEach((button) => {
				button.addEventListener('click', () => {
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
					`${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`
			)
			.join(', ');

		this.elements.workerStatus.textContent =
			workerStatusText || 'No workers hired';
	}

	/**
	 * Update upgrades display
	 */
	updateUpgrades() {
		if (!this.elements.upgradesContainer) return;

		const gameData = this.gameState.getState();
		const currentEraData = this.gameManager.getCurrentEraData();

		if (!currentEraData || !currentEraData.upgrades) return;

		this.elements.upgradesContainer.innerHTML = currentEraData.upgrades
			.map((upgrade) => {
				const isUnlocked = gameData.unlockedUpgrades.includes(upgrade.id);
				const canAfford = !isUnlocked && this.gameState.canAfford(upgrade.cost);

				const historicalInfo = upgrade.historical
					? `<p class="historical-info">📚 ${upgrade.historical}</p>`
					: '';

				return `
          <div class="upgrade-item ${
						isUnlocked ? 'unlocked' : canAfford ? 'available' : 'locked'
					}">
            <h4>${upgrade.name}</h4>
            <p class="upgrade-description">${upgrade.description}</p>
            <p class="upgrade-cost">Cost: ${this.formatCost(upgrade.cost)}</p>
            <p class="upgrade-effect">Effect: ${upgrade.effect}</p>
            ${historicalInfo}
            <button 
              class="upgrade-button" 
              data-upgrade-id="${upgrade.id}"
              ${isUnlocked || !canAfford ? 'disabled' : ''}
            >
              ${isUnlocked ? 'Purchased' : 'Buy'}
            </button>
          </div>
        `;
			})
			.join('');

		// Add event listeners to upgrade buttons
		this.elements.upgradesContainer
			.querySelectorAll('.upgrade-button')
			.forEach((button) => {
				if (!button.disabled) {
					button.addEventListener('click', () => {
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
		if (!this.elements.nextEraButton) return;

		const currentEraData = this.gameManager.getCurrentEraData();
		if (!currentEraData || !currentEraData.advancementCost) {
			this.elements.nextEraButton.style.display = 'none';
			return;
		}

		this.elements.nextEraButton.style.display = 'block';

		// Check if requirements are met
		const canAdvance = this.gameState.canAfford(currentEraData.advancementCost);
		this.elements.nextEraButton.disabled = !canAdvance;

		// Update button text with requirements
		const costString = Object.entries(currentEraData.advancementCost)
			.map(([resource, amount]) => `${amount} ${resource}`)
			.join(', ');

		this.elements.nextEraButton.textContent = canAdvance
			? 'Advance Era'
			: `Need: ${costString}`;

		// Add visual indication
		this.elements.nextEraButton.classList.toggle('affordable', canAdvance);
	}

	/**
	 * Format cost object for display
	 */
	formatCost(cost) {
		return Object.entries(cost)
			.map(
				([resource, amount]) =>
					`${amount} ${config.resourceIcons[resource] || resource}`
			)
			.join(', ');
	}

	/**
	 * Show notification to user
	 */
	showNotification(message, type = 'success', duration = 3000) {
		if (!this.elements.notificationContainer) return;

		const notification = document.createElement('div');
		notification.className = `notification notification-${type}`;
		notification.textContent = message;

		this.elements.notificationContainer.appendChild(notification);

		// Trigger animation
		setTimeout(() => notification.classList.add('show'), 10);

		// Remove notification
		setTimeout(() => {
			notification.classList.remove('show');
			setTimeout(() => notification.remove(), 300);
		}, duration);
	}

	/**
	 * Log an event
	 */
	logEvent(event) {
		if (!this.elements.eventLog) return;

		const logEntry = document.createElement('div');
		logEntry.className = 'log-entry';
		logEntry.innerHTML = `
      <h4>${event.name}</h4>
      <p>${event.impact}</p>
      <p>Effect: ${event.effect}</p>
      <small>${new Date().toLocaleTimeString()}</small>
    `;

		this.elements.eventLog.appendChild(logEntry);
		this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight;
	}

	/**
	 * Log a disaster
	 */
	logDisaster(disaster) {
		if (!this.elements.disasterLog) return;

		const logEntry = document.createElement('div');
		logEntry.className = 'log-entry disaster';
		logEntry.innerHTML = `
      <h4>${disaster.name}</h4>
      <p>${disaster.impact}</p>
      <p>Effect: ${disaster.effect}</p>
      <small>${new Date().toLocaleTimeString()}</small>
    `;

		this.elements.disasterLog.appendChild(logEntry);
		this.elements.disasterLog.scrollTop =
			this.elements.disasterLog.scrollHeight;
	}

	/**
	 * Update worker progress bar
	 */
	updateWorkerProgress(workerType, progress, maxProgress) {
		// This method can be implemented for worker progress visualization
		// For now, it's a placeholder
	}
}
