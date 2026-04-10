/**
 * UI Manager - Handles all user interface updates and interactions
 */

import { config } from '../core/config.js';

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
				'action-buttons-container'
			),

			// Resource display
			resourceDisplay: document.getElementById('resource-display'),

			// Era display
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

			// Save controls
			saveButton: document.getElementById('save-button'),
			exportButton: document.getElementById('export-button'),
			importButton: document.getElementById('import-button'),
			resetButton: document.getElementById('reset-button'),

			// Achievements
			achievementsContainer: document.getElementById('achievements-container'),
			achievementCount: document.getElementById('achievement-count'),

			// Prestige
			prestigeEP: document.getElementById('prestige-ep'),
			prestigeMultiplier: document.getElementById('prestige-multiplier'),
			prestigeResets: document.getElementById('prestige-resets'),
			prestigeGain: document.getElementById('prestige-gain'),
			prestigeButton: document.getElementById('prestige-button'),

			// Notifications
			notificationContainer: document.getElementById('notification-container'),
		};
	}

	/**
	 * Create enhanced action buttons dynamically
	 */
	createActionButtons() {
		this.elements.actionButtonsContainer.innerHTML = `
      <button id="forage-button" class="btn btn-outline-light d-flex align-items-center gap-2" title="Gather sticks and stones from the wilderness">
        <span class="button-icon">🪵</span>
        <span class="button-text text-start">
          <span class="button-title fw-semibold">Forage</span>
          <span class="button-desc d-block small text-secondary">Gather sticks</span>
        </span>
      </button>
      <button id="hunt-button" class="btn btn-outline-danger d-none d-flex align-items-center gap-2" title="Hunt animals for meat and materials">
        <span class="button-icon">🥩</span>
        <span class="button-text text-start">
          <span class="button-title fw-semibold">Hunt</span>
          <span class="button-desc d-block small text-secondary">Find meat</span>
        </span>
      </button>
      <button id="cook-button" class="btn btn-outline-warning d-none d-flex align-items-center gap-2" title="Cook raw meat to make it more nutritious">
        <span class="button-icon">🍗</span>
        <span class="button-text text-start">
          <span class="button-title fw-semibold">Cook</span>
          <span class="button-desc d-block small text-secondary">Prepare food</span>
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

		// Save controls
		if (this.elements.saveButton) {
			this.elements.saveButton.addEventListener('click', () => this.gameManager.saveGame());
		}
		if (this.elements.exportButton) {
			this.elements.exportButton.addEventListener('click', () => this.gameManager.exportSave());
		}
		if (this.elements.importButton) {
			this.elements.importButton.addEventListener('click', () => {
				const encoded = prompt('Paste your exported save data:');
				if (encoded) this.gameManager.importSave(encoded);
			});
		}
		if (this.elements.resetButton) {
			this.elements.resetButton.addEventListener('click', () => this.gameManager.resetGame());
		}

		// Prestige
		if (this.elements.prestigeButton) {
			this.elements.prestigeButton.addEventListener('click', () => this.gameManager.performPrestige());
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
		// log menu starts hidden via d-none in HTML
	}

	/**
	 * Toggle log menu visibility
	 */
	toggleLogMenu() {
		if (this.elements.logMenu) {
			this.elements.logMenu.classList.toggle('d-none');
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
			.filter(([key, value]) => value > 0 && key !== 'fire') // Exclude fire from display
			.map(
				([key, value]) => `
        <div class="resource-item list-group-item bg-dark text-light d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <span class="resource-icon">${config.resourceIcons[key] || '❓'}</span>
            <span class="resource-name">${this.formatResourceName(key)}</span>
          </div>
          <span class="badge bg-secondary rounded-pill" data-amount="${Math.floor(value)}">${this.formatNumber(Math.floor(value))}</span>
        </div>
      `
			)
			.join('');

		// Optional: subtle animation hook remains
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

		if (gameData.currentEra === 'paleolithic') {
			const hasStoneKnapping = this.gameState.hasUpgrade('stoneKnapping');
			const hasFireControl = this.gameState.hasUpgrade('fireControl');

			if (this.elements.huntButton) {
				this.elements.huntButton.classList.toggle('d-none', !hasStoneKnapping);
				if (hasStoneKnapping) {
					const huntDesc = this.elements.huntButton.querySelector('.button-desc');
					if (huntDesc) huntDesc.textContent = 'Hunt with stone tools';
				}
			}

			if (this.elements.cookButton) {
				this.elements.cookButton.classList.toggle('d-none', !hasFireControl);
				if (hasFireControl) {
					this.elements.cookButton.disabled = (gameData.resources.meat || 0) <= 0;
					const cookDesc = this.elements.cookButton.querySelector('.button-desc');
					if (cookDesc) cookDesc.textContent = 'Cook with fire';
				}
			}
		} else {
			if (this.elements.forageButton) this.elements.forageButton.classList.add('d-none');
			if (this.elements.huntButton) this.elements.huntButton.classList.add('d-none');
			if (this.elements.cookButton) this.elements.cookButton.classList.add('d-none');
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
				const actualCost = this.gameManager.systems.workerManager.calculateWorkerCost(worker.cost, workerCount);
				const canAfford = this.gameState.canAfford(actualCost);
				const hasRequiredUpgrade = !worker.requiresUpgrade || this.gameState.hasUpgrade(worker.requiresUpgrade);
				const canHire = canAfford && hasRequiredUpgrade;

				let statusText = '';
				if (!hasRequiredUpgrade) {
					statusText = `<span class=\"text-warning small\">⚠️ Requires: ${worker.requiresUpgrade}</span>`;
				} else if (!canAfford) {
					statusText = `<span class=\"text-secondary small\">💰 Need more resources</span>`;
				}

				return `
					<div class="col">
						<div class="card h-100 bg-dark border-secondary ${!hasRequiredUpgrade ? 'opacity-50' : ''}">
							<div class="card-body d-flex flex-column">
								<h4 class="h6 card-title mb-1">${worker.name}</h4>
								<p class="card-text small text-secondary mb-2">${worker.description}</p>
								<p class="mb-1"><span class="text-secondary small">Cost:</span> ${this.formatCost(actualCost)}</p>
								<p class="mb-2"><span class="text-secondary small">Owned:</span> ${workerCount}</p>
								<div class="mt-auto d-flex justify-content-between align-items-center">
									${statusText}
									<button class="hire-button btn btn-sm ${canHire ? 'btn-primary' : 'btn-secondary'}" data-worker-type="${worker.id}" ${!canHire ? 'disabled' : ''}>
										${!hasRequiredUpgrade ? 'Locked' : `Hire ${worker.name}`}
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
			})
			.join('');

		this.elements.workersContainer.querySelectorAll('.hire-button').forEach((button) => {
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
		const currentEraData = this.gameManager.getCurrentEraData();
		if (!currentEraData || !currentEraData.upgrades) return;

		this.elements.upgradesContainer.innerHTML = currentEraData.upgrades
			.map((upgrade) => {
				const isUnlocked = this.gameState.hasUpgrade(upgrade.id);
				const canAfford = !isUnlocked && this.gameState.canAfford(upgrade.cost);
				const cardState = isUnlocked ? 'border-success' : canAfford ? 'border-primary' : 'border-secondary';

				const historicalInfo = upgrade.historical
					? `<p class=\"small text-secondary mb-0\">📚 ${upgrade.historical}</p>`
					: '';

				return `
					<div class="col">
						<div class="card h-100 bg-dark ${cardState}">
							<div class="card-body d-flex flex-column">
								<h4 class="h6 card-title mb-1">${upgrade.name}</h4>
								<p class="card-text small text-secondary mb-2">${upgrade.description}</p>
								<p class="mb-1"><span class="text-secondary small">Cost:</span> ${this.formatCost(upgrade.cost)}</p>
								<p class="mb-2"><span class="text-secondary small">Effect:</span> ${upgrade.effect}</p>
								${historicalInfo}
								<div class="mt-auto">
									<button class="upgrade-button btn btn-sm ${isUnlocked ? 'btn-success' : canAfford ? 'btn-primary' : 'btn-secondary'}" data-upgrade-id="${upgrade.id}" ${isUnlocked || !canAfford ? 'disabled' : ''}>
										${isUnlocked ? 'Purchased' : 'Buy'}
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
			})
			.join('');

		this.elements.upgradesContainer.querySelectorAll('.upgrade-button').forEach((button) => {
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
			progressPercent = (fulfillments.reduce((a, b) => a + b, 0) / fulfillments.length) * 100;
		} else {
			progressPercent = 100;
		}

		// update all progress bars (sidebar + top bar)
		document.querySelectorAll('.progress-bar').forEach((bar) => {
			if (bar.closest('#cutscene-container')) return;
			bar.style.width = `${progressPercent.toFixed(1)}%`;
		});

		// update progress text
		const progressText = document.querySelector('.progress-text');
		if (progressText) {
			if (eraData?.advancementCost) {
				const costText = Object.entries(eraData.advancementCost)
					.map(([r, amt]) => `${Math.floor(this.gameState.getResource(r))}/${amt} ${r}`)
					.join(', ');
				progressText.textContent = costText;
			} else {
				progressText.textContent = 'Final era reached';
			}
		}

		// update advance button
		if (!this.elements.nextEraButton) return;
		this.elements.nextEraButton.disabled = !canAdvance;
		this.elements.nextEraButton.classList.toggle('btn-success', canAdvance);
		this.elements.nextEraButton.classList.toggle('btn-secondary', !canAdvance);
		this.elements.nextEraButton.style.display = 'block';
		this.elements.nextEraButton.textContent = canAdvance ? 'Advance Era' : 'Advance Era (requirements not met)';
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
	showNotification(message, type = 'success', duration = 2000) { // Reduced default from 3000 to 2000
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

		const effectText = event.effect
			? Object.entries(event.effect)
				.map(([resource, change]) => `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}% ${resource}`)
				.join(', ')
			: '';

		const logEntry = document.createElement('div');
		logEntry.className = 'log-entry';
		logEntry.innerHTML = `
      <h4>${event.name}</h4>
      <p>${event.description}</p>
      ${effectText ? `<p class="small text-secondary">Effect: ${effectText}</p>` : ''}
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
				.map(([resource, change]) => `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}% ${resource}`)
				.join(', ')
			: '';

		const logEntry = document.createElement('div');
		logEntry.className = 'log-entry disaster';
		logEntry.innerHTML = `
      <h4>${disaster.name}</h4>
      <p>${disaster.description}</p>
      ${effectText ? `<p class="small text-secondary">Effect: ${effectText}</p>` : ''}
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
			.map((a) => `
				<div class="col">
					<div class="d-flex align-items-center gap-2 p-2 rounded ${a.unlocked ? 'bg-dark border border-success' : 'bg-dark border border-secondary opacity-50'}">
						<span class="fs-5">${a.unlocked ? a.icon : '🔒'}</span>
						<div>
							<div class="small fw-semibold">${a.unlocked ? a.name : '???'}</div>
							<div class="small text-secondary">${a.unlocked ? a.description : 'Locked'}</div>
						</div>
					</div>
				</div>
			`)
			.join('');
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
			this.elements.prestigeMultiplier.textContent = pm.getMultiplier().toFixed(2) + 'x';
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
				: 'Prestige (reach Neolithic)';
			this.elements.prestigeButton.classList.toggle('btn-primary', canPrestige);
			this.elements.prestigeButton.classList.toggle('btn-ghost', !canPrestige);
		}
	}

}
