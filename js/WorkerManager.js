import { config } from './core/config.js';
import { data } from './data.js';

export class WorkerManager {
  constructor(state, uiManager, updateUI) {
    this.state = state;
    this.uiManager = uiManager;
    this.updateUI = updateUI;
    this.workerIntervals = {};
  }

  startWorkerTask(workerType, resourceType, baseYield, bonusKey) {
    if (this.workerIntervals[workerType]) {
      clearInterval(this.workerIntervals[workerType]);
    }
    const baseTimer = config.workerTimers[workerType];
    const timer = Math.max(
      1000,
      baseTimer * (1 - (this.state.upgrades.efficiency || 0) * 0.1)
    );

    // Create or update the progress bar for this worker type
    this.uiManager.updateWorkerProgress(workerType, 0, timer);

    this.workerIntervals[workerType] = setInterval(() => {
      this.performWorkerAction(workerType, resourceType, baseYield, bonusKey);

      // Reset the progress bar after each action
      this.uiManager.updateWorkerProgress(workerType, 0, timer);
    }, timer);

    // Start the progress bar animation
    this.uiManager.updateWorkerProgress(workerType, timer, timer);
  }

  performWorkerAction(workerType, resourceType, baseYield, bonusKey) {
    let totalYield = 0;
    let unfedWorkers = 0;

    for (let i = 0; i < this.state.workers[workerType]; i++) {
      if (this.state.resources.cookedMeat >= 1) {
        this.state.resources.cookedMeat--;
        totalYield += baseYield + (config.workerBonuses[bonusKey] || 0);
      } else if (resourceType === 'bones' && this.state.resources.bones >= 1) {
        this.state.resources.bones--; // Deduct bones if used as a resource
        totalYield += baseYield;
      } else if (resourceType === 'fur' && this.state.resources.fur >= 1) {
        this.state.resources.fur--; // Deduct fur if used as a resource
        totalYield += baseYield;
      } else {
        unfedWorkers++;
      }
    }

    if (unfedWorkers > 0) {
      this.uiManager.showNotification(
        `${unfedWorkers} ${workerType}(s) couldn't work due to lack of food.`,
        'error'
      );
    }

    this.state.resources[resourceType] += totalYield;
    this.updateUI();
  }

  startAllWorkerTasks() {
    const eraData = data.eras[this.state.age];
    if (!eraData) return;

    eraData.workers.forEach((worker) => {
      if (this.state.workers[worker.id] > 0) {
        const [resourceType, baseYield] = Object.entries(worker.effect)[0];
        const bonusKey = `workerBonus${
          worker.id.charAt(0).toUpperCase() + worker.id.slice(1)
        }`;
        this.startWorkerTask(worker.id, resourceType, baseYield, bonusKey);
      }
    });
  }

  getWorkerCost(workerType) {
    const worker = data.eras[this.state.age].workers.find(
      (w) => w.id === workerType
    );
    const multiplier = 1.5;
    const workerCount = this.state.workers[workerType] || 0;

    const cost = {};
    Object.entries(worker.cost).forEach(([resource, amount]) => {
      cost[resource] = Math.ceil(amount * Math.pow(multiplier, workerCount));
    });
    return cost;
  }

  hireWorker(workerType) {
    const worker = data.eras[this.state.age].workers.find(
      (w) => w.id === workerType
    );

    if (!worker) {
      this.uiManager.showNotification(
        'Worker type not available in this era',
        'error'
      );
      return;
    }

    const cost = this.getWorkerCost(workerType);

    if (!cost) {
      return;
    }

    // Check if the player can afford the worker
    const canAfford = Object.entries(cost).every(
      ([resource, amount]) => this.state.resources[resource] >= amount
    );

    if (canAfford) {
      // Deduct the resources
      Object.entries(cost).forEach(([resource, amount]) => {
        this.state.resources[resource] -= amount;
      });

      // Increment the worker count
      this.state.workers[workerType] =
        (this.state.workers[workerType] || 0) + 1;

      // Start or update the automated task for the worker
      const effect = worker.effect;
      const [resourceType, baseYield] = Object.entries(effect)[0];
      const bonusKey = `workerBonus${
        workerType.charAt(0).toUpperCase() + workerType.slice(1)
      }`;
      this.startWorkerTask(workerType, resourceType, baseYield, bonusKey);

      // Update the UI
      this.updateUI();
    } else {
      this.uiManager.showNotification('Cannot afford worker', 'error');
    }
  }

  triggerWorkerAction(workerType, resourceType, baseYield, bonusKey) {
    this.performWorkerAction(workerType, resourceType, baseYield, bonusKey);
  }
}
