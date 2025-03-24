import { config } from './config.js';

/**
 * Manages all resource-related operations in the game.
 * Handles resource gathering, processing, and worker production.
 */
export class ResourceManager {
	/**
	 * Creates a new ResourceManager instance.
	 * @param {Object} state - The game state object
	 * @param {Function} updateProgressCallback - Callback for updating progression
	 * @param {Object} uiManager - The UI manager instance
	 */
	constructor(state, updateProgressCallback, uiManager) {
		this.state = state;
		this.updateProgress = updateProgressCallback;
		this.uiManager = uiManager;
	}

	/**
	 * Core resource gathering method used by all gathering operations.
	 * @param {string} resourceType - Type of resource to gather
	 * @param {number} baseYield - Base amount to gather
	 * @param {string} workerType - Type of worker performing the gathering
	 * @param {string} bonusKey - Key for any applicable bonuses
	 * @param {string} chanceKey - Key for probability checks
	 */
	gatherResource(resourceType, baseYield, workerType, bonusKey, chanceKey) {
		// Feed workers and calculate active workers
		let fedWorkers = 0;
		const workers = this.state.workers[workerType];
		for (let i = 0; i < workers; i++) {
			if (this.state.resources.cookedMeat >= 1) {
				this.state.resources.cookedMeat -= 1;
				fedWorkers++;
			}
		}
		this.state.workers[workerType] = fedWorkers;

		// Calculate total yield with bonuses
		const bonus = fedWorkers * (config.workerBonuses[bonusKey] || 0);
		const chanceBonus =
			chanceKey && Math.random() < (config.probabilities[chanceKey] || 0)
				? 1
				: 0;
		const efficiencyMultiplier = this.getEfficiencyMultiplier(resourceType);

		// Apply yield and update state
		this.state.resources[resourceType] +=
			(baseYield + bonus + chanceBonus) * efficiencyMultiplier;
		this.updateProgress(1);
		this.uiManager.updateUI();

		// Handle special cases for meat gathering
		if (resourceType === 'meat') {
			this.handleMeatGatheringExtras();
		}
	}

	/**
	 * Gets the efficiency multiplier for a resource type.
	 * @param {string} resourceType - The type of resource
	 * @returns {number} The efficiency multiplier
	 */
	getEfficiencyMultiplier(resourceType) {
		if (resourceType === 'meat') return config.gameVariables.meatProduction;
		if (resourceType === 'food') return config.gameVariables.foodProduction;
		return 1;
	}

	/**
	 * Handles additional resources from meat gathering (bones, fur).
	 */
	handleMeatGatheringExtras() {
		this.state.resources.bones = (this.state.resources.bones || 0) + 1;
		const furYield = Math.floor(Math.random() * 4);
		this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

		this.uiManager.showNotification(
			`You hunted and got 1 bone and ${furYield} fur!`,
			'success'
		);
	}

	/**
	 * Gathers resources based on the specified parameters.
	 * @param {string} resourceType - Type of resource to gather
	 * @param {number} baseYield - Base amount to gather
	 * @param {string} workerType - Type of worker performing the gathering
	 * @param {string} bonusKey - Key for any applicable bonuses
	 * @param {string} chanceKey - Key for probability checks
	 */
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

	/**
	 * Specialized method for gathering sticks with possible stone finds.
	 */
	gatherSticks() {
		this.gather(
			'sticks',
			1 + (this.state.upgrades.stickEfficiency || 0),
			'woodcutter',
			'workerBonusStick',
			'stoneChanceFromSticks'
		);
	}

	/**
	 * Specialized method for mining stones.
	 */
	mineStone() {
		this.gather(
			'stones',
			1 + (this.state.upgrades.stoneEfficiency || 0),
			'miner',
			'workerBonusStone'
		);
	}

	/**
	 * Specialized method for hunting animals.
	 */
	huntAnimal() {
		this.gather('meat', config.yields.huntYield, 'hunter', 'workerBonusMeat');
	}

	/**
	 * Crafts clothes from fur if resources are available.
	 */
	craftClothes() {
		const REQUIRED_FUR = 5;
		if (this.state.resources.fur >= REQUIRED_FUR) {
			this.state.resources.fur -= REQUIRED_FUR;
			this.state.resources.clothes = (this.state.resources.clothes || 0) + 1;
			this.uiManager.showNotification('You crafted clothes!', 'success');
		} else {
			this.uiManager.showNotification(
				'Not enough fur to craft clothes!',
				'error'
			);
		}
	}

	/**
	 * Applies clothing bonus to a worker type if available.
	 * @param {string} workerType - The type of worker to buff
	 */
	applyClothesToWorker(workerType) {
		if (
			this.state.resources.clothes > 0 &&
			this.state.workers[workerType] > 0
		) {
			this.state.resources.clothes -= 1;
			const bonusKey = `workerBonus${
				workerType.charAt(0).toUpperCase() + workerType.slice(1)
			}`;
			config.workerBonuses[bonusKey] *= 2;

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

	/**
	 * Processes raw meat into cooked meat with possible burning.
	 */
	cookMeatClick() {
		if (this.state.resources.meat <= 0) {
			this.uiManager.showNotification('No raw meat to cook!', 'error');
			return;
		}

		const cookEfficiency = this.state.upgrades.cookEfficiency || 1;
		let cookedCount = this.processCooking(cookEfficiency);

		this.uiManager.showNotification(
			`You successfully cooked ${cookedCount} meat!`,
			'success'
		);
		this.updateProgress(1);
		this.uiManager.updateUI();
	}

	/**
	 * Processes a batch of cooking operations.
	 * @param {number} cookEfficiency - The cooking efficiency modifier
	 * @returns {number} The amount of successfully cooked meat
	 */
	processCooking(cookEfficiency) {
		let cookedCount = 0;

		// Manual cooking
		for (let i = 0; i < cookEfficiency && this.state.resources.meat > 0; i++) {
			if (this.attemptCooking()) cookedCount++;
		}

		// Worker cooking
		const cooks = this.state.workers.cook || 0;
		for (let i = 0; i < cooks && this.state.resources.meat > 0; i++) {
			if (this.attemptCooking()) cookedCount++;
		}

		return cookedCount;
	}

	/**
	 * Attempts to cook a single piece of meat.
	 * @returns {boolean} Whether the cooking was successful
	 */
	attemptCooking() {
		this.state.resources.meat -= 1;
		if (Math.random() >= config.probabilities.burnChance) {
			this.state.resources.cookedMeat += 1;
			return true;
		} else {
			this.uiManager.showNotification('A piece of meat burned!', 'warning');
			return false;
		}
	}

	/**
	 * Forages for sticks with a chance to find stones.
	 */
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
