/**
 * Achievement Manager - Tracks milestones and awards achievements
 */

import { config } from '../core/config.js';

// achievement definitions: id, name, description, icon, check function
const ACHIEVEMENTS = [
	// clicking milestones
	{ id: 'firstClick', name: 'First Steps', description: 'Perform your first action', icon: '👆', check: (d) => d.progression.totalClicks >= 1 },
	{ id: 'click100', name: 'Busy Hands', description: 'Perform 100 actions', icon: '🖐️', check: (d) => d.progression.totalClicks >= 100 },
	{ id: 'click1000', name: 'Tireless', description: 'Perform 1,000 actions', icon: '💪', check: (d) => d.progression.totalClicks >= 1000 },

	// population milestones
	{ id: 'pop10', name: 'Small Band', description: 'Reach 10 population', icon: '👥', check: (d) => (d.resources.population || 0) >= 10 },
	{ id: 'pop50', name: 'Growing Tribe', description: 'Reach 50 population', icon: '🏕️', check: (d) => (d.resources.population || 0) >= 50 },
	{ id: 'pop200', name: 'Village', description: 'Reach 200 population', icon: '🏘️', check: (d) => (d.resources.population || 0) >= 200 },
	{ id: 'pop1000', name: 'Town', description: 'Reach 1,000 population', icon: '🏙️', check: (d) => (d.resources.population || 0) >= 1000 },
	{ id: 'pop10000', name: 'City', description: 'Reach 10,000 population', icon: '🌆', check: (d) => (d.resources.population || 0) >= 10000 },
	{ id: 'pop1M', name: 'Metropolis', description: 'Reach 1,000,000 population', icon: '🌍', check: (d) => (d.resources.population || 0) >= 1000000 },

	// worker milestones
	{ id: 'firstWorker', name: 'Delegation', description: 'Hire your first worker', icon: '👷', check: (d) => Object.values(d.workers).reduce((a, b) => a + b, 0) >= 1 },
	{ id: 'workers10', name: 'Workforce', description: 'Have 10 workers', icon: '🏗️', check: (d) => Object.values(d.workers).reduce((a, b) => a + b, 0) >= 10 },
	{ id: 'workers50', name: 'Industry', description: 'Have 50 workers', icon: '🏭', check: (d) => Object.values(d.workers).reduce((a, b) => a + b, 0) >= 50 },

	// upgrade milestones
	{ id: 'firstUpgrade', name: 'Innovation', description: 'Purchase your first upgrade', icon: '💡', check: (d) => Object.values(d.upgrades).filter(Boolean).length >= 1 },
	{ id: 'upgrades5', name: 'Researcher', description: 'Purchase 5 upgrades', icon: '🔬', check: (d) => Object.values(d.upgrades).filter(Boolean).length >= 5 },
	{ id: 'upgrades15', name: 'Polymath', description: 'Purchase 15 upgrades', icon: '🎓', check: (d) => Object.values(d.upgrades).filter(Boolean).length >= 15 },

	// era milestones
	{ id: 'eraNeolithic', name: 'Agricultural Revolution', description: 'Reach the Neolithic Era', icon: '🌾', check: (d) => eraIndex(d.currentEra) >= 1 },
	{ id: 'eraBronze', name: 'Age of Metal', description: 'Reach the Bronze Age', icon: '🔨', check: (d) => eraIndex(d.currentEra) >= 2 },
	{ id: 'eraIron', name: 'Iron Will', description: 'Reach the Iron Age', icon: '⛓️', check: (d) => eraIndex(d.currentEra) >= 3 },
	{ id: 'eraClassical', name: 'Classical Thinker', description: 'Reach the Classical Era', icon: '🏛️', check: (d) => eraIndex(d.currentEra) >= 4 },
	{ id: 'eraMedieval', name: 'Middle Ages', description: 'Reach the Medieval Era', icon: '🏰', check: (d) => eraIndex(d.currentEra) >= 5 },
	{ id: 'eraRenaissance', name: 'Rebirth', description: 'Reach the Renaissance', icon: '🎨', check: (d) => eraIndex(d.currentEra) >= 6 },
	{ id: 'eraIndustrial', name: 'Industrial Titan', description: 'Reach the Industrial Age', icon: '🚂', check: (d) => eraIndex(d.currentEra) >= 7 },
	{ id: 'eraInformation', name: 'Digital Age', description: 'Reach the Information Age', icon: '💻', check: (d) => eraIndex(d.currentEra) >= 8 },
	{ id: 'eraSpace', name: 'To the Stars', description: 'Reach the Space Age', icon: '🚀', check: (d) => eraIndex(d.currentEra) >= 9 },
	{ id: 'eraGalactic', name: 'Galactic Civilization', description: 'Reach the Galactic Era', icon: '🌌', check: (d) => eraIndex(d.currentEra) >= 10 },
	{ id: 'eraUniversal', name: 'Transcendence', description: 'Reach the Universal Era', icon: '🌀', check: (d) => eraIndex(d.currentEra) >= 11 },

	// cooking
	{ id: 'firstCook', name: 'Chef', description: 'Cook your first meat', icon: '🍳', check: (d) => (d.resources.cookedMeat || 0) >= 1 },

	// prestige
	{ id: 'firstPrestige', name: 'Time Loop', description: 'Prestige for the first time', icon: '🔄', check: (d) => (d.prestige?.totalResets || 0) >= 1 },
	{ id: 'prestige5', name: 'Eternal Return', description: 'Prestige 5 times', icon: '♾️', check: (d) => (d.prestige?.totalResets || 0) >= 5 },
];

const ERA_ORDER = [
	'paleolithic', 'neolithic', 'bronze', 'iron', 'classical',
	'medieval', 'renaissance', 'industrial', 'information',
	'space', 'galactic', 'universal',
];

function eraIndex(era) {
	const i = ERA_ORDER.indexOf(era);
	return i >= 0 ? i : 0;
}

export class AchievementManager {
	constructor(gameState) {
		this.gameState = gameState;
		this.uiManager = null;
		this.checkAccum = 0;
	}

	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	/**
	 * Called from game loop. Checks achievements every 2 seconds.
	 */
	update(deltaTime) {
		this.checkAccum += deltaTime;
		if (this.checkAccum < 2000) return;
		this.checkAccum -= 2000;

		this.checkAchievements();
	}

	checkAchievements() {
		const data = this.gameState.data;
		const unlocked = data.progression.achievements;

		for (const achievement of ACHIEVEMENTS) {
			if (unlocked.includes(achievement.id)) continue;

			try {
				if (achievement.check(data)) {
					unlocked.push(achievement.id);
					this.onAchievementUnlocked(achievement);
				}
			} catch {
				// skip if check fails (missing data field)
			}
		}
	}

	onAchievementUnlocked(achievement) {
		this.uiManager?.showNotification(
			`${achievement.icon} Achievement: ${achievement.name} - ${achievement.description}`,
			'info',
			5000
		);
		this.uiManager?.updateAchievements?.();
	}

	/**
	 * Get all achievements with their unlock status
	 */
	getAllAchievements() {
		const unlocked = this.gameState.data.progression.achievements;
		return ACHIEVEMENTS.map((a) => ({
			...a,
			unlocked: unlocked.includes(a.id),
		}));
	}

	getUnlockedCount() {
		return this.gameState.data.progression.achievements.length;
	}

	getTotalCount() {
		return ACHIEVEMENTS.length;
	}
}
