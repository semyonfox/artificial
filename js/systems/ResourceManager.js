import { config } from '../core/config.js';

/**
 * Manages all resource-related operations in the game.
 * Handles resource gathering, processing, and worker production.
 */
export class ResourceManager {
	/**
	 * Creates a new ResourceManager instance.
	 * @param {GameState} gameState - The game state instance
	 */
	constructor(gameState) {
		this.gameState = gameState;
		this.uiManager = null;
		
		console.log('ResourceManager initialized');
	}

	/**
	 * Set UI Manager reference
	 */
	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	/**
	 * Perform foraging action - gather sticks and occasionally stones
	 */
	forage() {
		const baseYield = config.yields.forageYield;
		const stickMultiplier = this.gameState.getEfficiencyMultiplier('sticks');
		
		// Calculate stick yield
		const stickYield = Math.floor(baseYield * stickMultiplier);
		this.gameState.addResource('sticks', stickYield);
		
		// Chance for stones
		if (Math.random() < config.probabilities.stoneChanceFromSticks) {
			const stoneYield = Math.floor(baseYield * 0.5 * this.gameState.getEfficiencyMultiplier('stones'));
			this.gameState.addResource('stones', stoneYield);
		}
		
		// Show notification
		this.showGatheringResult('Foraged', { sticks: stickYield });
		
		return { sticks: stickYield };
	}

	/**
	 * Perform hunting action - requires stone knapping upgrade
	 */
	hunt() {
		if (!this.gameState.hasUpgrade('stoneKnapping')) {
			this.uiManager?.showNotification('Need Stone Knapping to hunt!', 'warning');
			return null;
		}
		
		const baseYield = config.yields.huntYield;
		const meatMultiplier = this.gameState.getEfficiencyMultiplier('meat');
		
		// Calculate yields
		const meatYield = Math.floor(baseYield * meatMultiplier);
		const boneYield = Math.random() < 0.6 ? 1 : 0;
		const furYield = Math.random() < config.probabilities.furDropChance ? 1 : 0;
		
		// Add resources
		this.gameState.addResource('meat', meatYield);
		if (boneYield > 0) this.gameState.addResource('bones', boneYield);
		if (furYield > 0) this.gameState.addResource('fur', furYield);
		
		// Show notification
		const results = { meat: meatYield };
		if (boneYield > 0) results.bones = boneYield;
		if (furYield > 0) results.fur = furYield;
		
		this.showGatheringResult('Hunted', results);
		
		return results;
	}

	/**
	 * Perform cooking action - requires fire control upgrade and raw meat
	 */
	cook() {
		if (!this.gameState.hasUpgrade('fireControl')) {
			this.uiManager?.showNotification('Need Fire Control to cook!', 'warning');
			return null;
		}
		
		if (this.gameState.getResource('meat') < 1) {
			this.uiManager?.showNotification('Need raw meat to cook!', 'warning');
			return null;
		}
		
		// Consume raw meat
		this.gameState.addResource('meat', -1);
		
		// Check for burning (failure)
		if (Math.random() < config.probabilities.burnChance) {
			this.uiManager?.showNotification('The meat burned while cooking!', 'error');
			return { failed: true };
		}
		
		// Successful cooking
		const cookedYield = 2; // Cooking multiplies meat value
		this.gameState.addResource('cookedMeat', cookedYield);
		
		// Maintain fire
		this.gameState.addResource('fire', 0.1);
		
		this.showGatheringResult('Cooked', { cookedMeat: cookedYield });
		
		return { cookedMeat: cookedYield };
	}

	/**
	 * Process worker production for a specific worker type
	 */
	processWorkerProduction(workerType, workerData) {
		const workerCount = this.gameState.getWorkerCount(workerType);
		if (workerCount === 0) return null;
		
		let successfulWorkers = 0;
		let failedWorkers = 0;
		const totalProduction = {};
		
		for (let i = 0; i < workerCount; i++) {
			const workerResult = this.processIndividualWorker(workerType, workerData);
			
			if (workerResult.success) {
				successfulWorkers++;
				
				// Add to total production
				Object.entries(workerResult.production).forEach(([resource, amount]) => {
					totalProduction[resource] = (totalProduction[resource] || 0) + amount;
				});
			} else {
				failedWorkers++;
			}
		}
		
		// Apply total production
		Object.entries(totalProduction).forEach(([resource, amount]) => {
			this.gameState.addResource(resource, amount);
		});
		
		// Show results
		if (successfulWorkers > 0) {
			this.showWorkerResult(workerType, successfulWorkers, totalProduction);
		}
		
		if (failedWorkers > 0) {
			this.uiManager?.showNotification(
				`${failedWorkers} ${workerData.name}(s) couldn't work (need resources)`,
				'warning'
			);
		}
		
		return {
			successfulWorkers,
			failedWorkers,
			totalProduction,
		};
	}

	/**
	 * Process production for a single worker
	 */
	processIndividualWorker(workerType, workerData) {
		// Check if worker can consume required resources
		if (workerData.consumes) {
			if (!this.gameState.canAfford(workerData.consumes)) {
				return { success: false, reason: 'insufficient_resources' };
			}
			
			// Consume resources
			this.gameState.spendResources(workerData.consumes);
		}
		
		// Calculate production with efficiency bonuses
		const production = {};
		
		if (workerData.produces) {
			Object.entries(workerData.produces).forEach(([resource, baseAmount]) => {
				const efficiency = this.gameState.getEfficiencyMultiplier(resource);
				const actualAmount = baseAmount * efficiency;
				production[resource] = actualAmount;
			});
		}
		
		return { success: true, production };
	}

	/**
	 * Show gathering result notification
	 */
	showGatheringResult(action, results) {
		if (!this.uiManager) return;
		
		const resultText = Object.entries(results)
			.map(([resource, amount]) => `${amount} ${resource}`)
			.join(', ');
		
		this.uiManager.showNotification(`${action}: +${resultText}`, 'success');
	}

	/**
	 * Show worker production result
	 */
	showWorkerResult(workerType, count, production) {
		if (!this.uiManager) return;
		
		const productionText = Object.entries(production)
			.map(([resource, amount]) => `${Math.floor(amount * 10) / 10} ${resource}`)
			.join(', ');
		
		this.uiManager.showNotification(
			`${count} ${workerType}(s) produced: ${productionText}`,
			'success'
		);
	}

	/**
	 * Calculate total resource value for progression tracking
	 */
	calculateTotalResourceValue() {
		const state = this.gameState.getState();
		let totalValue = 0;
		
		Object.entries(state.resources).forEach(([resource, amount]) => {
			// Weight different resources differently for progression
			const weight = this.getResourceWeight(resource);
			totalValue += amount * weight;
		});
		
		return totalValue;
	}

	/**
	 * Get resource weight for progression calculation
	 */
	getResourceWeight(resource) {
		const weights = {
			// Basic resources
			sticks: 1,
			stones: 2,
			meat: 3,
			cookedMeat: 5,
			bones: 4,
			fur: 6,
			fire: 8,
			population: 20,
			
			// Advanced resources have higher weights
			grain: 10,
			pottery: 15,
			bronze: 25,
			writing: 30,
			steel: 40,
			electricity: 60,
			computers: 100,
		};
		
		return weights[resource] || 10; // Default weight
	}
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
		const gameData = this.state.getState();

		switch (resourceType) {
			case 'sticks':
				return gameData.upgrades.stickEfficiency || 1;
			case 'stones':
				return gameData.upgrades.stoneEfficiency || 1;
			case 'meat':
			case 'bones':
			case 'fur':
				return gameData.upgrades.huntingEfficiency || 1;
			default:
				return 1;
		}
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
	 * Forage for basic resources - sticks and sometimes stones
	 */
	forage() {
		const sticksAmount = 1 * this.getEfficiencyMultiplier('sticks');
		this.state.addResource('sticks', sticksAmount);

		this.uiManager?.showNotification(
			`Foraged ${Math.floor(sticksAmount)} sticks`,
			'success'
		);

		// Small chance to find stones while foraging
		if (Math.random() < 0.15) {
			const stonesAmount = 1 * this.getEfficiencyMultiplier('stones');
			this.state.addResource('stones', stonesAmount);

			this.uiManager?.showNotification(
				`Found ${Math.floor(stonesAmount)} stones while foraging!`,
				'info'
			);
		}
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
	 * Hunt animals for meat, bones, and fur - requires wooden spear
	 */
	huntAnimal() {
		const gameData = this.state.getState();

		// Check if player has stone knapping upgrade
		if (!gameData.upgrades.stoneKnapping) {
			this.uiManager?.showNotification(
				'You need stone knapping skills to hunt animals safely!',
				'error'
			);
			return;
		}

		// Hunt for meat with efficiency multiplier
		const meatAmount = 1 * this.getEfficiencyMultiplier('meat');
		this.state.addResource('meat', meatAmount);

		// Always get bones from hunting
		const bonesAmount = 1 * this.getEfficiencyMultiplier('bones');
		this.state.addResource('bones', bonesAmount);

		// Chance to get fur
		let furMessage = '';
		if (Math.random() < 0.4) {
			const furAmount =
				Math.floor(Math.random() * 3 + 1) * this.getEfficiencyMultiplier('fur');
			this.state.addResource('fur', furAmount);
			furMessage = ` and ${Math.floor(furAmount)} fur`;
		}

		this.uiManager?.showNotification(
			`Hunted! Got ${Math.floor(meatAmount)} meat, ${Math.floor(
				bonesAmount
			)} bones${furMessage}`,
			'success'
		);
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
	 * Cook raw meat into cooked meat - requires fire control
	 */
	cookMeatClick() {
		const gameData = this.state.getState();

		// Check if player has fire control upgrade
		if (!gameData.upgrades.fireControl) {
			this.uiManager?.showNotification(
				'You need to master fire control before you can cook!',
				'error'
			);
			return;
		}

		if (gameData.resources.meat <= 0) {
			this.uiManager?.showNotification('No raw meat to cook!', 'error');
			return;
		}

		// Cook meat (1:1 ratio but can be improved with upgrades)
		this.state.addResource('meat', -1);
		this.state.addResource('cookedMeat', 1);

		this.uiManager?.showNotification('Successfully cooked meat!', 'success');
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
