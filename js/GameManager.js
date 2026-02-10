/**
 * Game Manager - Main game coordination system
 * Handles game logic, progression, and system coordination
 */

import { GameState } from './core/GameState.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { UIManager } from './systems/UIManager.js';
import { WorkerManager } from './systems/WorkerManager.js';
import { EventManager } from './systems/EventManager.js';
import { config } from './core/config.js';

export class GameManager {
	constructor() {
		this.initialized = false;
		this.systems = {};
		this.gameLoopId = null;
		this.lastUpdateTime = performance.now();
		this.gameState = null;

		console.log('GameManager created, starting initialization...');
		this.initialize();
	}

	/**
	 * Initialize the game systems in proper order
	 */
	async initialize() {
		try {
			console.log('Initializing game systems...');

			// Create game state first
			this.gameState = new GameState();

			// Try to load saved game
			const loadSuccess = this.gameState.load();
			if (loadSuccess) {
				console.log('Loaded saved game');
			} else {
				console.log('Starting new game');
			}

			// Initialize systems in dependency order
			this.initializeSystems();

			// Connect system dependencies
			this.connectSystems();

			// Set up event listeners
			this.setupEventListeners();

			// Start game loop
			this.startGameLoop();

			// Start performance monitoring
			this.startPerformanceMonitoring();

			// Initial UI update
			this.updateUI();

			this.initialized = true;
			console.log('Game initialized successfully');
		} catch (error) {
			console.error('Failed to initialize game:', error);
			throw error;
		}
	}

	/**
	 * Initialize all game systems
	 */
	initializeSystems() {
		// Initialize systems that don't depend on others first
		this.systems.resourceManager = new ResourceManager(this.gameState);
		this.systems.workerManager = new WorkerManager(this.gameState);
		this.systems.eventManager = new EventManager(this.gameState);

		// Initialize UI manager last (depends on other systems)
		this.systems.uiManager = new UIManager(this.gameState, this);
	}

	/**
	 * Connect systems that need references to each other
	 */
	connectSystems() {
		// Connect UI manager to other systems
		this.systems.resourceManager.setUIManager(this.systems.uiManager);
		this.systems.workerManager.setUIManager(this.systems.uiManager);
		this.systems.eventManager.setUIManager(this.systems.uiManager);

		// Connect worker manager to game manager for era data
		this.systems.workerManager.setGameManager(this);
	}

	/**
	 * Set up event listeners for cross-system communication
	 */
	setupEventListeners() {
		// Listen for resource changes to update UI
		this.gameState.addListener('resourceChange', (data) => {
			this.updateProgression();
			if (this.systems.uiManager) {
				this.systems.uiManager.updateResources();
			}
		});

		// Listen for worker changes
		this.gameState.addListener('workerChange', (data) => {
			if (this.systems.uiManager) {
				this.systems.uiManager.updateWorkers();
			}
		});

		// Listen for upgrade unlocks
		this.gameState.addListener('upgradeUnlocked', (data) => {
			this.systems.uiManager?.showNotification(
				`Unlocked: ${data.upgradeId}`,
				'success'
			);
			if (this.systems.uiManager) {
				this.systems.uiManager.updateUpgrades();
			}
		});

		// Auto-save every interval
		this.autoSaveInterval = setInterval(() => {
			if (this.gameState && this.gameState.data.settings.autoSave) {
				this.gameState.save();
			}
		}, config.storage.autoSaveInterval);
	}

	/**
	 * Start the main game loop
	 */
	startGameLoop() {
		const gameLoop = (currentTime) => {
			const deltaTime = currentTime - this.lastUpdateTime;
			this.lastUpdateTime = currentTime;

			this.update(deltaTime);
			this.gameLoopId = requestAnimationFrame(gameLoop);
		};

		this.gameLoopId = requestAnimationFrame(gameLoop);
	}

	/**
	 * Main game update loop
	 */
	update(deltaTime) {
		if (!this.initialized) return;

		// Update performance stats
		if (this.performanceStats) {
			this.performanceStats.frameCount++;
			this.performanceStats.totalFrameTime += deltaTime;
		}

		// Update total play time
		this.gameState.data.totalPlayTime += deltaTime;

		// Update all systems
		if (this.systems.eventManager) {
			this.systems.eventManager.update(this.lastUpdateTime);
		}

		if (this.systems.workerManager) {
			this.systems.workerManager.update(deltaTime);
		}

		// Update UI periodically (every 1 second)
		if (this.lastUpdateTime % 1000 < deltaTime) {
			this.updateUI();
		}

		// Check for era advancement (every 10 seconds)
		if (this.lastUpdateTime % 10000 < deltaTime) {
			this.checkEraAdvancement();
		}

		// Validate game state periodically (every 5 seconds)
		if (this.lastUpdateTime % 5000 < deltaTime) {
			this.gameState.validate();
		}

		// Update population growth
		this.updatePopulationGrowth(deltaTime);
	}

	/**
	 * Perform a game action with button feedback
	 */
	performAction(button, action, cooldownMs = 1000) {
		if (button.disabled) return;

		// Disable button temporarily
		button.disabled = true;
		button.style.opacity = '0.6';

		try {
			// Execute the action
			action();

			// Update UI
			this.updateUI();

			// Re-enable button after cooldown
			setTimeout(() => {
				button.disabled = false;
				button.style.opacity = '1';
			}, cooldownMs);
		} catch (error) {
			console.error('Action failed:', error);
			button.disabled = false;
			button.style.opacity = '1';
		}
	}

	/**
	 * Forage for resources
	 */
	forage() {
		this.systems.resourceManager.forage();
		this.updateProgression(1);
	}

	/**
	 * Hunt for food
	 */
	findFood() {
		this.systems.resourceManager.huntAnimal();
		this.updateProgression(1);
	}

	/**
	 * Cook meat
	 */
	cookMeat() {
		this.systems.resourceManager.cookMeatClick();
		this.updateProgression(1);
	}

	/**
	 * Hire a worker
	 */
	hireWorker(workerType) {
		this.systems.workerManager.hireWorker(workerType);
	}

	/**
	 * Buy an upgrade
	 */
	buyUpgrade(upgradeId) {
		const currentEraData = this.getCurrentEraData();
		const upgrade = currentEraData.upgrades.find((u) => u.id === upgradeId);

		if (!upgrade) {
			this.systems.uiManager.showNotification('Upgrade not found', 'error');
			return false;
		}

		if (!this.gameState.canAfford(upgrade.cost)) {
			this.systems.uiManager.showNotification('Cannot afford upgrade', 'error');
			return false;
		}

		if (this.gameState.spendResources(upgrade.cost)) {
			// Unlock via GameState API
			this.gameState.unlockUpgrade(upgradeId);
			// Apply any side effects
			this.applyUpgradeEffect(upgrade);
			this.systems.uiManager.showNotification(
				`Purchased ${upgrade.name}!`,
				'success'
			);
			this.updateUI();
			return true;
		}

		return false;
	}

	/**
	 * Apply upgrade effects (side effects only; unlocking handled by GameState)
	 */
	applyUpgradeEffect(upgrade) {
		console.log(`Applied upgrade: ${upgrade.name}`);

		switch (upgrade.id) {
			case 'stoneKnapping':
				this.systems.uiManager?.showNotification(
					'Stone knapping mastered! Better tools and hunting unlocked!',
					'info',
					4000
				);
				break;
			case 'fireControl':
				// Fire is now an upgrade, not a resource - no resource to add
				this.systems.uiManager?.showNotification(
					'Fire mastered! Cooking unlocked - you can now cook meat!',
					'info',
					4000
				);
				break;
			case 'boneTools':
				this.systems.uiManager?.showNotification(
					'Bone tools crafted! Gathering efficiency improved!',
					'success',
					4000
				);
				break;
			case 'clothing':
				this.systems.uiManager?.showNotification(
					'Fur clothing created! Population growth increased by 50%!',
					'info',
					4000
				);
				break;
			case 'shelterBuilding':
				this.systems.uiManager?.showNotification(
					'Shelters built! Population growth doubled!',
					'success',
					4000
				);
				break;
		}
	}

	/**
	 * Check if player can afford something
	 */
	canAfford(cost) {
		return this.gameState.canAfford(cost);
	}

	/**
	 * Update game progression
	 */
	updateProgression(amount = 1) {
		if (this.gameState && this.gameState.data) {
			this.gameState.data.progression = {
				...this.gameState.data.progression,
				totalClicks: (this.gameState.data.progression.totalClicks || 0) + amount,
			};
		}
	}

	/**
	 * Update population growth - flat passive growth with upgrade multipliers
	 */
	updatePopulationGrowth(deltaTime) {
		const currentPop = this.gameState.getResource('population');
		const currentEra = this.gameState.data.currentEra;
		const maxPop = config.balance?.maxPopulationPerEra?.[currentEra] || 50;

		// Don't grow beyond era cap
		if (currentPop >= maxPop) return;

		// Base flat growth: 0.1 population per 10 seconds = 0.01 per second
		let baseGrowthPerSecond = 0.01;

		// Apply upgrade multipliers (multiplicative, not exponential based on pop)
		let growthMultiplier = 1.0;

		// Clothing upgrade: 1.5× growth rate
		if (this.gameState.hasUpgrade('clothing')) {
			growthMultiplier *= 1.5;
		}

		// Shelter upgrade: 2× growth rate
		if (this.gameState.hasUpgrade('shelterBuilding')) {
			growthMultiplier *= 2.0;
		}

		// Calculate actual growth for this frame
		const growth = baseGrowthPerSecond * growthMultiplier * (deltaTime / 1000);

		// Add population, but don't exceed era maximum
		const newPop = Math.min(currentPop + growth, maxPop);
		const actualGrowth = newPop - currentPop;

		if (actualGrowth > 0) {
			this.gameState.addResource('population', actualGrowth);
		}
	}

	/**
	 * Update the UI display
	 */
	updateUI() {
		if (this.systems.uiManager) {
			this.systems.uiManager.updateUI();
		}
	}

	/**
	 * Save the game
	 */
	saveGame() {
		try {
			const success = this.gameState.save();
			if (success) {
				this.systems.uiManager?.showNotification(
					'Game saved successfully!',
					'success'
				);
			} else {
				this.systems.uiManager?.showNotification(
					'Failed to save game',
					'error'
				);
			}
			return success;
		} catch (error) {
			console.error('Save game error:', error);
			this.systems.uiManager?.showNotification('Error saving game', 'error');
			return false;
		}
	}

	/**
	 * Load the game
	 */
	loadGame() {
		try {
			const success = this.gameState.load();
			if (success) {
				this.systems.uiManager?.showNotification(
					'Game loaded successfully!',
					'success'
				);
				this.updateUI();
				// Restart worker automation for loaded workers
				this.restartWorkerAutomation();
			} else {
				this.systems.uiManager?.showNotification(
					'No saved game found',
					'warning'
				);
			}
			return success;
		} catch (error) {
			console.error('Load game error:', error);
			this.systems.uiManager?.showNotification('Error loading game', 'error');
			return false;
		}
	}

	/**
	 * Reset the game
	 */
	resetGame() {
		if (
			confirm('Are you sure you want to reset the game? This cannot be undone.')
		) {
			try {
				// Stop all systems
				this.stopAllSystems();

				// Reset game state
				this.gameState.reset();

				// Clear localStorage
				localStorage.removeItem(config.storage.saveKey);

				// Restart worker automation
				this.restartWorkerAutomation();

				// Update UI
				this.updateUI();

				this.systems.uiManager?.showNotification(
					'Game reset successfully!',
					'info'
				);
				return true;
			} catch (error) {
				console.error('Reset game error:', error);
				this.systems.uiManager?.showNotification(
					'Error resetting game',
					'error'
				);
				return false;
			}
		}
		return false;
	}

	/**
	 * Stop all running systems
	 */
	stopAllSystems() {
		// Stop worker automation
		if (this.systems.workerManager) {
			this.systems.workerManager.stopAllWorkers();
		}

		// Stop game loop
		if (this.gameLoopId) {
			cancelAnimationFrame(this.gameLoopId);
			this.gameLoopId = null;
		}
	}

	/**
	 * Restart worker automation after load/reset
	 */
	restartWorkerAutomation() {
		if (this.systems.workerManager) {
			this.systems.workerManager.restartAllWorkers();
		}
	}

	/**
	 * Get current era data with workers and upgrades
	 */
	getCurrentEraData() {
		const currentEra = this.gameState.data.currentEra;
		return config.eraData[currentEra] || config.eraData.paleolithic;
	}

	/**
	 * Get comprehensive data for all eras
	 */
	getAllEraData() {
		return config.eraData;
	}

	/**
	 * Check if era advancement is possible and notify player
	 */
	checkEraAdvancement() {
		if (this.gameState.canAdvanceEra()) {
			const currentEra = this.gameState.data.currentEra;
			const nextEra = this.getNextEra(currentEra);

			if (nextEra) {
				this.systems.uiManager?.showNotification(
					`🌟 Ready to advance to ${
						config.eras[nextEra]?.name || nextEra
					}! Check the era panel.`,
					'info',
					8000
				);
			}
		}
	}

	/**
	 * Get the next era in progression
	 */
	getNextEra(currentEra) {
		const eraOrder = [
			'paleolithic',
			'neolithic',
			'bronze',
			'iron',
			'classical',
			'medieval',
			'renaissance',
			'industrial',
			'information',
			'space',
			'galactic',
			'universal',
		];
		const currentIndex = eraOrder.indexOf(currentEra);

		if (currentIndex >= 0 && currentIndex < eraOrder.length - 1) {
			return eraOrder[currentIndex + 1];
		}

		return null;
	}

	/**
	 * Advance to the next era
	 */
	advanceEra() {
		const currentEra = this.gameState.data.currentEra;
		const nextEra = this.getNextEra(currentEra);

		if (!nextEra) {
			this.systems.uiManager?.showNotification(
				'You are already in the final era!',
				'warning'
			);
			return false;
		}

		if (!this.gameState.canAdvanceEra()) {
			this.systems.uiManager?.showNotification(
				'Requirements not met for era advancement',
				'error'
			);
			return false;
		}

		// Advance the era
		this.gameState.data.currentEra = nextEra;

		// Reset era-specific progress
		this.gameState.data.progression.eraProgress = 0;

		// Show advancement notification
		const eraInfo = config.eras[nextEra];
		this.systems.uiManager?.showNotification(
			`🎉 Entered the ${eraInfo?.name || nextEra}! ${
				eraInfo?.description || ''
			}`,
			'success',
			10000
		);

		// Trigger listeners
		this.gameState.notifyListeners('eraAdvancement', {
			oldEra: currentEra,
			newEra: nextEra,
		});

		// Update UI
		this.updateUI();

		console.log(`Advanced from ${currentEra} to ${nextEra}`);
		return true;
	}

	/**
	 * Handle era transition effects
	 */
	onEraTransition(fromEra, toEra) {
		// Add some starting resources for the new era
		const newEraData = this.getCurrentEraData();

		// Grant small amounts of new era's basic resources
		if (toEra === 'neolithic') {
			this.gameState.addResource('grain', 10);
			this.gameState.addResource('clay', 5);
		} else if (toEra === 'bronze') {
			this.gameState.addResource('copper', 15);
			this.gameState.addResource('tin', 5);
		} else if (toEra === 'iron') {
			this.gameState.addResource('iron', 20);
		} else if (toEra === 'industrial') {
			this.gameState.addResource('coal', 50);
		} else if (toEra === 'information') {
			this.gameState.addResource('silicon', 25);
		}

		console.log(`Era transition: ${fromEra} -> ${toEra}`);
	}

	/**
	 * Destroy the game manager and cleanup resources
	 */
	destroy() {
		try {
			// Stop all systems
			this.stopAllSystems();

			// Stop performance monitoring
			this.stopPerformanceMonitoring();

			// Clear all event listeners
			this.gameState?.removeAllListeners();

			// Clear auto-save interval
			if (this.autoSaveInterval) {
				clearInterval(this.autoSaveInterval);
				this.autoSaveInterval = null;
			}

			// Reset references
			this.gameState = null;
			this.systems = {};
			this.initialized = false;

			console.log('GameManager destroyed');
		} catch (error) {
			console.error('Error destroying GameManager:', error);
		}
	}

	/**
	 * Get game statistics for debugging and analytics
	 */
	getGameStats() {
		if (!this.gameState) return null;

		const data = this.gameState.data;
		const totalResources = Object.values(data.resources).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalWorkers = Object.values(data.workers).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalUpgrades = Object.values(data.upgrades).filter(Boolean).length;

		return {
			era: data.currentEra,
			playTime: data.totalPlayTime,
			totalResources,
			totalWorkers,
			totalUpgrades,
			population: data.resources.population || 0,
			progression: data.progression,
		};
	}

	/**
	 * Performance monitoring and optimization
	 */
	startPerformanceMonitoring() {
		this.performanceStats = {
			frameCount: 0,
			totalFrameTime: 0,
			averageFPS: 0,
			lastFPSUpdate: performance.now(),
		};

		// Update FPS every second
		this.fpsUpdateInterval = setInterval(() => {
			const now = performance.now();
			const deltaTime = now - this.performanceStats.lastFPSUpdate;

			if (deltaTime >= 1000) {
				this.performanceStats.averageFPS = Math.round(
					(this.performanceStats.frameCount * 1000) / deltaTime
				);
				this.performanceStats.frameCount = 0;
				this.performanceStats.lastFPSUpdate = now;
			}
		}, 1000);
	}

	/**
	 * Stop performance monitoring
	 */
	stopPerformanceMonitoring() {
		if (this.fpsUpdateInterval) {
			clearInterval(this.fpsUpdateInterval);
			this.fpsUpdateInterval = null;
		}
		this.performanceStats = null;
	}

	/**
	 * Get performance statistics
	 */
	getPerformanceStats() {
		return this.performanceStats ? { ...this.performanceStats } : null;
	}
}
