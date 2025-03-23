import { config } from './config.js';

export class ResourceManager {
	constructor(state, updateProgressCallback, uiManager) {
		this.state = state;
		this.updateProgress = updateProgressCallback;
		this.uiManager = uiManager;
	}

	gatherResource(resourceType, baseYield, workerType, bonusKey, chanceKey) {
		let fedWorkers = 0;
		const workers = this.state.workers[workerType];
		for (let i = 0; i < workers; i++) {
			if (this.state.resources.cookedMeat >= 1) {
				this.state.resources.cookedMeat -= 1; // Deduct cooked meat for each worker
				fedWorkers++;
			}
		}
		this.state.workers[workerType] = fedWorkers;

		const bonus = fedWorkers * (config.workerBonuses[bonusKey] || 0); // Use config for bonuses
		const chanceBonus =
			chanceKey && Math.random() < (config.probabilities[chanceKey] || 0) // Use config for probabilities
				? 1
				: 0;

		const efficiencyMultiplier =
			resourceType === 'meat'
				? config.gameVariables.meatProduction
				: resourceType === 'food'
				? config.gameVariables.foodProduction
				: 1;

		this.state.resources[resourceType] +=
			(baseYield + bonus + chanceBonus) * efficiencyMultiplier;
		this.updateProgress(1);
		this.uiManager.updateUI();

		if (resourceType === 'meat') {
			// Always give 1 bone per hunt
			this.state.resources.bones = (this.state.resources.bones || 0) + 1;

			// Randomly give 0-3 fur
			const furYield = Math.floor(Math.random() * 4); // Random between 0 and 3
			this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

			this.uiManager.showNotification(
				`You hunted and got 1 bone and ${furYield} fur!`,
				'success'
			);
		}
	}

	gather(resourceType, baseYield, workerType, bonusKey, chanceKey = null) {
		this.gatherResource(
			resourceType,
			baseYield,
			workerType,
			bonusKey,
			chanceKey
		);

		if (resourceType === 'meat') {
			this.state.resources.bones = (this.state.resources.bones || 0) + 1;

			if (Math.random() < config.probabilities.furDropChance) {
				const furYield = Math.floor(Math.random() * 4) + 1;
				this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

				this.uiManager.showNotification(
					`You hunted and got 1 bone and ${furYield} fur!`,
					'success'
				);
			} else {
				this.uiManager.showNotification(
					`You hunted and got 1 bone but no fur this time.`,
					'info'
				);
			}
		}
	}

	gatherSticks() {
		this.gather(
			'sticks',
			1 + (this.state.upgrades.stickEfficiency || 0), // Apply stick efficiency upgrade
			'woodcutter',
			'workerBonusStick',
			'stoneChanceFromSticks'
		);
	}

	mineStone() {
		this.gather(
			'stones',
			1 + (this.state.upgrades.stoneEfficiency || 0), // Apply stone efficiency upgrade
			'miner',
			'workerBonusStone'
		);
	}

	huntAnimal() {
		this.gather('meat', config.yields.huntYield, 'hunter', 'workerBonusMeat');
	}

	craftClothes() {
		if (this.state.resources.fur >= 5) {
			this.state.resources.fur -= 5;
			this.state.resources.clothes = (this.state.resources.clothes || 0) + 1;
			this.uiManager.showNotification('You crafted clothes!', 'success');
		} else {
			this.uiManager.showNotification(
				'Not enough fur to craft clothes!',
				'error'
			);
		}
	}

	applyClothesToWorker(workerType) {
		if (
			this.state.resources.clothes > 0 &&
			this.state.workers[workerType] > 0
		) {
			this.state.resources.clothes -= 1;
			config.workerBonuses[
				`workerBonus${workerType.charAt(0).toUpperCase() + workerType.slice(1)}`
			] *= 2;
			this.uiManager.showNotification(
				`${
					workerType.charAt(0).toUpperCase() + workerType.slice(1)
				} efficiency doubled!`,
				'success'
			);
		} else {
			this.uiManager.showNotification(
				'No clothes available or no workers to apply to!',
				'error'
			);
		}
	}

	cookMeatClick() {
		const cookEfficiency = this.state.upgrades.cookEfficiency || 1; // Base cooking efficiency
		let cookedCount = 0;

		if (this.state.resources.meat > 0) {
			// Cook meat manually
			for (
				let i = 0;
				i < cookEfficiency && this.state.resources.meat > 0;
				i++
			) {
				this.state.resources.meat -= 1;
				if (Math.random() >= config.probabilities.burnChance) {
					this.state.resources.cookedMeat += 1;
					cookedCount++;
				} else {
					this.uiManager.showNotification('A piece of meat burned!', 'warning');
				}
			}

			// Let cook workers assist
			const cooks = this.state.workers.cook || 0;
			for (let i = 0; i < cooks; i++) {
				if (this.state.resources.meat > 0) {
					this.state.resources.meat -= 1;
					if (Math.random() >= config.probabilities.burnChance) {
						this.state.resources.cookedMeat += 1;
						cookedCount++;
					} else {
						this.uiManager.showNotification(
							'A piece of meat burned!',
							'warning'
						);
					}
				}
			}

			this.uiManager.showNotification(
				`You successfully cooked ${cookedCount} meat!`,
				'success'
			);
			this.updateProgress(1);
			this.uiManager.updateUI();
		} else {
			this.uiManager.showNotification('No raw meat to cook!', 'error');
		}
	}

	forage() {
		const stickYield = 1 + (this.state.upgrades.stickEfficiency || 0); // Apply stick efficiency upgrade
		const stoneChance =
			Math.random() < config.probabilities.stoneChanceFromSticks; // Use centralized stone chance
		const stoneYield = stoneChance
			? 1 + (this.state.upgrades.stoneEfficiency || 0)
			: 0;

		this.state.resources.sticks += stickYield;
		if (stoneYield > 0) {
			this.state.resources.stones += stoneYield;
			this.uiManager.showNotification('You found a stone!', 'success', 1000);
		}

		this.uiManager.updateUI();
	}
}
