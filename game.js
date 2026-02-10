/**
 * Main Game Entry Point
 * Simplified initialization for immediate game start
 */

import { GameManager } from './js/GameManager.js';

class Game {
	constructor() {
		this.gameManager = null;
		this.gameStarted = false;
		this.currentSceneIndex = 0;
		this.scenes = [];

		this.init();
	}

	/**
	 * Initialize the game immediately
	 */
	init() {
		console.log('🎮 Starting Evolution Clicker...');
		console.log('DOM readyState:', document.readyState);

		// Show cutscenes
		this.showCutscenes();
	}

	/**
	 * Show cutscenes with proper scene transitions
	 */
	showCutscenes() {
		console.log('🎬 Showing cutscenes...');

		const cutsceneContainer = document.getElementById('cutscene-container');
		const gameContainer = document.getElementById('game-container');

		console.log('Cutscene container found:', !!cutsceneContainer);
		console.log('Game container found:', !!gameContainer);

		if (!cutsceneContainer) {
			console.error('❌ Cutscene container not found!');
			this.startMainGame();
			return;
		}

		if (gameContainer) {
			gameContainer.classList.add('d-none');
		}

		// Show cutscene container (remove d-none if present)
		cutsceneContainer.classList.remove('d-none');

		// Get all scenes
		this.scenes = Array.from(cutsceneContainer.querySelectorAll('.scene'));
		console.log(`Found ${this.scenes.length} scenes:`, this.scenes);

		if (this.scenes.length === 0) {
			console.warn('⚠️ No scenes found, starting game immediately');
			this.startMainGame();
			return;
		}

		// Show first scene
		this.currentSceneIndex = 0;
		this.showScene(0);

		// Use event delegation on the container instead of individual buttons
		// This ensures events work even if buttons are hidden/shown dynamically
		cutsceneContainer.addEventListener('click', (e) => {
			// Check if the clicked element is a scene-next button or inside one
			const button = e.target.closest('.scene-next');
			if (button) {
				console.log('🖱️ Scene next button clicked via delegation');
				e.preventDefault();
				e.stopPropagation();
				this.nextScene();
			}
		});

		console.log('✅ Event delegation set up on cutscene container');

		// Update progress bar
		this.updateSceneProgress();
	}

	/**
	 * Show a specific scene
	 */
	showScene(index) {
		console.log(`🎬 Attempting to show scene ${index + 1}`);

		// Hide all scenes using Bootstrap classes
		this.scenes.forEach((scene, i) => {
			scene.classList.remove('active');
			scene.classList.add('d-none');
			console.log(`  Scene ${i + 1} hidden`);
		});

		// Show current scene
		if (this.scenes[index]) {
			this.scenes[index].classList.remove('d-none');
			this.scenes[index].classList.add('active');
			console.log(`✅ Scene ${index + 1} of ${this.scenes.length} is now visible`);
			console.log('  Scene classes:', this.scenes[index].className);
		}

		this.updateSceneProgress();
	}

	/**
	 * Go to next scene or start game
	 */
	nextScene() {
		console.log(`📍 Current scene index: ${this.currentSceneIndex}`);
		this.currentSceneIndex++;
		console.log(`📍 Moving to scene index: ${this.currentSceneIndex}`);

		if (this.currentSceneIndex >= this.scenes.length) {
			// All scenes done, start game
			console.log('🎬 All cutscenes complete, starting game...');
			this.startMainGame();
		} else {
			// Show next scene
			console.log(`🎬 Showing next scene (${this.currentSceneIndex + 1}/${this.scenes.length})`);
			this.showScene(this.currentSceneIndex);
		}
	}

	/**
	 * Update scene progress bar
	 */
	updateSceneProgress() {
		const progressBar = document.querySelector('#cutscene-container .progress-bar');
		if (progressBar && this.scenes.length > 0) {
			const progress = ((this.currentSceneIndex + 1) / this.scenes.length) * 100;
			progressBar.style.width = `${progress}%`;
			console.log(`📊 Progress updated: ${progress}%`);
		} else {
			console.warn('⚠️ Progress bar not found or no scenes');
		}
	}

	/**
	 * Start the main game
	 */
	startMainGame() {
		if (this.gameStarted) {
			console.log('⚠️ Game already started, ignoring...');
			return;
		}

		this.gameStarted = true;
		console.log('🚀 Starting main game...');

		try {
			// Hide cutscene, show game using Bootstrap classes
			const cutsceneContainer = document.getElementById('cutscene-container');
			const gameContainer = document.getElementById('game-container');

			console.log('Switching from cutscene to game...');

			if (cutsceneContainer) {
				cutsceneContainer.classList.add('d-none');
				console.log('✅ Cutscene hidden');
			}

			if (gameContainer) {
				gameContainer.classList.remove('d-none');
				console.log('✅ Game container shown');
			}

			// Initialize the main game manager
			console.log('🎮 Initializing GameManager...');
			this.gameManager = new GameManager();

			// Make game globally accessible for debugging
			window.game = this.gameManager;

			console.log('✅ Game started successfully!');
			console.log('Game object:', this.gameManager);
		} catch (error) {
			console.error('❌ Failed to start game:', error);
			this.showErrorMessage(error);
		}
	}

	/**
	 * Show error message to user
	 */
	showErrorMessage(error) {
		const errorDiv = document.createElement('div');
		errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 10000;
      max-width: 500px;
      text-align: center;
    `;
		errorDiv.innerHTML = `
      <h3>Game Failed to Start</h3>
      <p>${error.message}</p>
      <p style="font-size: 12px; margin-top: 10px;">Check console for details (F12)</p>
    `;
		document.body.appendChild(errorDiv);
	}
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
	console.log('⏳ Waiting for DOM to load...');
	document.addEventListener('DOMContentLoaded', () => {
		console.log('✅ DOM loaded, starting game');
		new Game();
	});
} else {
	console.log('✅ DOM already loaded, starting game immediately');
	new Game();
}
