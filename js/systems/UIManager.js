import { config } from '../core/config.js';
import { EraRegistry } from './data/EraRegistry.js';
import { eraLoader } from './systems/EraLoader.js';

export class UIManager {
  constructor(state, gameManager, eraRegistry) {
    this.state = state;
    this.gameManager = gameManager;
    this.eraRegistry = eraRegistry; // Add this
    this.cacheElements();
    this.addEventListeners();
    this.initLogMenu();
  }

  getCurrentEraData() {
    return this.eraRegistry.getEraData(this.state.currentEra);
  }

  cacheElements() {
    this.elements = {
      forageButton: document.getElementById('forage-button'),
      huntButton: document.getElementById('hunt-button'),
      cookButton: document.getElementById('cook-button'),
      resourceDisplay: document.getElementById('resource-display'),
      upgradesContainer: document.getElementById('upgrades'), // For upgrades
      itemsContainer: document.getElementById('items'), // Add a new container for items
      eraDisplay: document.getElementById('era-display'),
      hireButtons: {
        woodcutter: document.getElementById('hire-woodcutter'),
        miner: document.getElementById('hire-miner'),
        hunter: document.getElementById('hire-hunter'),
        cook: document.getElementById('hire-cook'),
      },
      workerStatus: document.getElementById('worker-status'),
      logMenu: document.getElementById('log-menu'),
      logToggle: document.getElementById('log-toggle'),
      eventLog: document.getElementById('event-log'),
      disasterLog: document.getElementById('disaster-log'),
      notificationContainer: document.getElementById('notification-container'),
      eraDetails: document.getElementById('era-details'), // Add this line
    };
  }

  addEventListeners() {
    this.elements.forageButton.addEventListener('click', () =>
      this.gameManager.performAction(
        this.elements.forageButton,
        () => this.gameManager.resourceManager.forage(),
        100
      )
    );
    this.elements.huntButton.addEventListener('click', () =>
      this.gameManager.performAction(
        this.elements.huntButton,
        () => this.gameManager.findFood(),
        120
      )
    );
    this.elements.cookButton.addEventListener('click', () =>
      this.gameManager.performAction(
        this.elements.cookButton,
        () => this.gameManager.resourceManager.cookMeatClick(),
        80
      )
    );
    Object.entries(this.elements.hireButtons).forEach(([type, button]) =>
      button.addEventListener('click', () => this.gameManager.hireWorker(type))
    );
    this.elements.logToggle.addEventListener('click', () => {
      this.elements.logMenu.classList.toggle('collapsed');
    });
  }

  initLogMenu() {
    this.elements.logMenu.classList.add('collapsed'); // Start collapsed
  }

  updateUI() {
    this.updateResources();
    this.updateEraDisplay();

    const eraData = this.eraRegistry.getEraData(this.state.currentEra);
    const elements = [...(eraData?.upgrades || []), ...(eraData?.items || [])];
    this.renderElements(
      elements,
      this.elements.upgradesContainer,
      'upgrade-item'
    );

    this.updateButtons();
    this.updateWorkerStatus();
  }

  updateResources() {
    this.elements.resourceDisplay.innerHTML = Object.entries(
      this.state.resources
    )
      .filter(([_, val]) => val > 0) // Only display resources with a value greater than 0
      .map(
        ([key, val]) =>
          `<div class="resource">${
            config.resourceIcons[key] || key
          } ${Math.floor(val)}</div>` // Use config for icons
      )
      .join('');
  }

  updateEraDisplay() {
    this.elements.eraDisplay.textContent = `Era: ${
      this.gameManager.eraData[this.state.age]?.name || 'Unknown'
    }`;
  }

  updateEraDetails(era) {
    this.elements.eraDetails.innerHTML = `
			<h2>${era.name}</h2>
			<p>${era.dateRange}</p>
			<ul>
				${era.keyFeatures.map((feature) => `<li>${feature}</li>`).join('')}
			</ul>
		`;
  }

  updateButtons() {
    const eraData = data.eras[this.state.age];

    // Update action buttons visibility
    this.elements.huntButton.classList.toggle(
      'hidden',
      !this.state.upgrades[
        eraData?.upgrades?.find((u) => u.id === 'fireControl')?.effect
          ?.unlockFeature
      ]
    );
    this.elements.cookButton.classList.toggle(
      'hidden',
      !this.state.upgrades[
        eraData?.upgrades?.find((u) => u.id === 'fireControl')?.effect
          ?.unlockFeature
      ]
    );

    // Update hire buttons with proper worker data
    Object.entries(this.elements.hireButtons).forEach(([type, button]) => {
      // Find the worker data for this type
      const worker = eraData?.workers?.find((w) => w.id === type);

      // If worker exists for this era, show the button with cost, otherwise hide it
      if (worker) {
        button.textContent = `Hire ${worker.name} (${this.formatCost(
          worker.cost
        )})`;
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
    });

    this.elements.logToggle.style.display = 'block';
  }

  updateWorkerStatus() {
    this.elements.workerStatus.textContent = Object.entries(this.state.workers)
      .map(
        ([type, count]) =>
          `${type.charAt(0).toUpperCase() + type.slice(1)}s: ${count || 0}`
      )
      .join(', ');
  }

  renderElements(elements, container, type) {
    container.innerHTML = '';
    if (!elements) return;

    elements.forEach((element) => {
      const currentCount = this.state.upgrades[`${element.id}_count`] || 0;
      const remainingCount = element.maxCount
        ? element.maxCount - currentCount
        : Infinity;
      const canAfford = this.gameManager.canAfford(element.cost);

      const elementEl = document.createElement('div');
      elementEl.className = `upgrade-item ${
        remainingCount <= 0 ? 'maxed-out' : canAfford ? 'available' : 'locked'
      }`;
      elementEl.innerHTML = `
				<h3>${element.name}</h3>
				<p>${element.description}</p>
				<div>Cost: ${this.formatCost(element.cost)}</div>
				<div>Remaining: ${remainingCount}</div>
				<button ${remainingCount <= 0 ? 'disabled' : ''} class="${
        remainingCount <= 0 ? 'maxed' : canAfford ? 'buyable' : 'unaffordable'
      }">
					${remainingCount <= 0 ? 'Maxed Out' : 'Buy'}
				</button>
			`;
      elementEl.querySelector('button').addEventListener('click', () => {
        if (type === 'upgrade-item') {
          this.gameManager.buyUpgrade(element.id);
        } else {
          this.gameManager.buyItem(element.id);
        }
      });
      container.appendChild(elementEl);
    });
  }

  formatCost(cost) {
    return Object.entries(cost)
      .map(
        ([resource, amount]) =>
          `${amount} ${config.resourceIcons[resource] || resource}` // Use config for icons
      )
      .join(', ');
  }

  getIcon(resource) {
    return config.resourceIcons[resource] || resource; // Use centralized icons
  }

  logEvent(event) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
			<h4>${event.name}</h4>
			<p>${event.impact}</p>
			<p>Effect: ${event.effect}</p>
		`;
    this.elements.eventLog.appendChild(logEntry);
    this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight; // Auto-scroll to the latest log
  }

  logDisaster(disaster) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
			<h4>${disaster.name}</h4>
			<p>${disaster.impact}</p>
			<p>Effect: ${disaster.effect}</p>
		`;
    this.elements.disasterLog.appendChild(logEntry);
    this.elements.disasterLog.scrollTop =
      this.elements.disasterLog.scrollHeight; // Auto-scroll to the latest log
  }

  showNotification(message, type = 'success', duration = 2000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    this.elements.notificationContainer.appendChild(notification);

    // Remove the notification after the specified duration
    setTimeout(() => {
      notification.remove();
    }, duration);
  }

  updateWorkerProgress(workerType, duration, totalDuration) {
    let progressBar = document.querySelector(`#${workerType}-progress`);
    if (!progressBar) {
      // Create a new progress bar if it doesn't exist
      progressBar = document.createElement('div');
      progressBar.id = `${workerType}-progress`;
      progressBar.className = 'worker-progress-bar';
      this.elements.workerStatus.appendChild(progressBar);
    }

    // Update the progress bar's width and animation
    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = `${(duration / totalDuration) * 100}%`;

    // Remove the progress bar when the task is complete
    if (duration === 0) {
      setTimeout(() => progressBar.remove(), totalDuration);
    }
  }
}
