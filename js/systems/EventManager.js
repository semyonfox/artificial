/**
 * Event Manager - Handles historical events, disasters, and discoveries
 * Provides educational content based on historical periods
 */

import { config } from '../core/config.js';

export class EventManager {
	constructor(gameState) {
		this.gameState = gameState;
		this.uiManager = null;
		this.lastEventTime = 0;
		this.eventCooldown = 60000; // 1 minute between possible events

		console.log('EventManager initialized');
	}

	/**
	 * Set UI manager reference
	 */
	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	/**
	 * Update method called from game loop
	 */
	update(currentTime) {
		if (currentTime - this.lastEventTime > this.eventCooldown) {
			this.checkForRandomEvent();
			this.lastEventTime = currentTime;
		}
	}

	/**
	 * Check if a random event should occur
	 */
	checkForRandomEvent() {
		const gameData = this.gameState.getState();
		const currentEra = gameData.currentEra;

		// Only trigger events if we have enough population/progress
		const population = gameData.resources.population || 1;
		const minPopulation = this.getMinimumPopulationForEvents(currentEra);

		if (population < minPopulation) return;

		// Scale event probability with population and era progress
		const scaledEventChance = this.calculateEventProbability(
			population,
			currentEra
		);

		if (Math.random() < scaledEventChance) {
			this.triggerRandomEvent(currentEra);
		}
	}

	/**
	 * Get minimum population required for events in each era
	 */
	getMinimumPopulationForEvents(era) {
		const minimums = {
			paleolithic: 2,
			neolithic: 5,
			bronze: 10,
			iron: 20,
			industrial: 50,
			information: 100,
		};
		return minimums[era] || 2;
	}

	/**
	 * Calculate event probability based on population and era
	 */
	calculateEventProbability(population, era) {
		const baseChance = config.probabilities.eventChance;
		const populationFactor = Math.min(2.0, 1 + (population / 100) * 0.1);

		// Later eras have more frequent events
		const eraMultipliers = {
			paleolithic: 0.8,
			neolithic: 1.0,
			bronze: 1.2,
			iron: 1.3,
			industrial: 1.5,
			information: 1.8,
		};

		const eraFactor = eraMultipliers[era] || 1.0;
		return baseChance * populationFactor * eraFactor;
	}

	/**
	 * Trigger a random historical event for the current era
	 */
	triggerRandomEvent(era) {
		const events = config.events[era];
		if (!events || events.length === 0) return;

		const randomEvent = events[Math.floor(Math.random() * events.length)];
		this.executeEvent(randomEvent);
	}

	/**
	 * Execute an event and apply its effects
	 */
	executeEvent(event) {
		// Apply resource effects
		if (event.effect) {
			Object.entries(event.effect).forEach(([resource, change]) => {
				const currentAmount = this.gameState.data.resources[resource] || 0;
				const changeAmount =
					change > 0
						? Math.floor(currentAmount * change)
						: Math.floor(currentAmount * Math.abs(change));

				this.gameState.addResource(resource, changeAmount);
			});
		}

		// Show notification based on event type
		const notificationType =
			event.type === 'disaster'
				? 'error'
				: event.type === 'discovery'
				? 'info'
				: 'success';

		this.uiManager?.showNotification(
			`${this.getEventIcon(event.type)} ${event.name}: ${event.description}`,
			notificationType,
			6000
		);

		// Log the event
		this.logEvent(event);
	}

	/**
	 * Get appropriate icon for event type
	 */
	getEventIcon(type) {
		switch (type) {
			case 'disaster':
				return '⚠️';
			case 'discovery':
				return '🔍';
			case 'breakthrough':
				return '💡';
			default:
				return '📜';
		}
	}

	/**
	 * Log event to game history (placeholder for future log system)
	 */
	logEvent(event) {
		// This could be expanded to maintain a history of events
		console.log(`Historical Event: ${event.name} - ${event.description}`);
	}

	/**
	 * Manually trigger a specific event (for testing or story purposes)
	 */
	triggerEvent(eventName, era = null) {
		const gameData = this.gameState.getState();
		const currentEra = era || gameData.currentEra;
		const events = config.events[currentEra];

		if (events) {
			const event = events.find((e) => e.name === eventName);
			if (event) {
				this.executeEvent(event);
			}
		}
	}

	/**
	 * Get historical information about the current era
	 */
	getEraInfo(era) {
		return config.eras[era] || null;
	}

	/**
	 * Cleanup
	 */
	destroy() {
		// Cleanup if needed
	}
}
