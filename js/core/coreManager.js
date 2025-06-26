/**
 * Core Manager - Central coordination system
 * Manages initialization and communication between major systems
 */

import { config } from './config.js';
import { GameState } from '../state/gameState.js';
import { EraRegistry } from '../data/eraRegistry.js';
import { EraLoader } from '../eraLoader.js';

export class CoreManager {
	constructor() {
		this.initialized = false;
		this.systems = {};

		this.initializeSystems();
	}

	/**
	 * Initialize all core systems in proper order
	 */
	async initializeSystems() {
		try {
			console.log('Initializing core systems...');

			// Initialize configuration
			this.systems.config = config;

			// Initialize game state
			this.systems.gameState = new GameState();

			// Initialize era systems
			this.systems.eraRegistry = new EraRegistry();
			this.systems.eraLoader = new EraLoader(this.systems.eraRegistry);

			// Preload initial era
			await this.systems.eraLoader.loadEra('paleolithic');

			this.initialized = true;
			console.log('Core systems initialized successfully');

			// Dispatch initialization complete event
			this.dispatchEvent('coreInitialized', this.systems);
		} catch (error) {
			console.error('Failed to initialize core systems:', error);
			throw error;
		}
	}

	/**
	 * Get a specific system
	 */
	getSystem(systemName) {
		return this.systems[systemName];
	}

	/**
	 * Get all systems
	 */
	getAllSystems() {
		return this.systems;
	}

	/**
	 * Check if systems are initialized
	 */
	isInitialized() {
		return this.initialized;
	}

	/**
	 * Dispatch custom events
	 */
	dispatchEvent(eventName, data = null) {
		const event = new CustomEvent(`core:${eventName}`, { detail: data });
		document.dispatchEvent(event);
	}

	/**
	 * Listen for core events
	 */
	addEventListener(eventName, callback) {
		document.addEventListener(`core:${eventName}`, callback);
	}

	/**
	 * Update all systems (called by game loop)
	 */
	update(deltaTime) {
		if (!this.initialized) return;

		// Update systems that need regular updates
		// This can be expanded as needed
	}

	/**
	 * Save all system states
	 */
	saveState() {
		if (this.systems.gameState) {
			this.systems.gameState.saveToStorage();
		}
	}

	/**
	 * Load all system states
	 */
	loadState() {
		if (this.systems.gameState) {
			this.systems.gameState.loadFromStorage();
		}
	}

	/**
	 * Reset all systems
	 */
	reset() {
		if (this.systems.gameState) {
			this.systems.gameState.reset();
		}

		// Reset other systems as needed
		this.dispatchEvent('coreReset');
	}
}

// Export singleton instance
export const coreManager = new CoreManager();
