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
		// Show cutscenes
		this.showCutscenes();
	}

	/**
	 * Show cutscenes with proper scene transitions
	 */
	showCutscenes() {
		const cutsceneContainer = document.getElementById('cutscene-container');
		const gameContainer = document.getElementById('game-container');

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
				e.preventDefault();
				e.stopPropagation();
				this.nextScene();
			}
		});

		// Update progress bar
		this.updateSceneProgress();
	}

	/**
	 * Show a specific scene
	 */
	showScene(index) {
		// Hide all scenes using Bootstrap classes
		this.scenes.forEach((scene) => {
			scene.classList.remove('active');
			scene.classList.add('d-none');
		});

		// Show current scene
		if (this.scenes[index]) {
			this.scenes[index].classList.remove('d-none');
			this.scenes[index].classList.add('active');
		}

		this.updateSceneProgress();
	}

	/**
	 * Go to next scene or start game
	 */
	nextScene() {
		this.currentSceneIndex++;

		if (this.currentSceneIndex >= this.scenes.length) {
			this.startMainGame();
		} else {
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
		} else {
			console.warn('⚠️ Progress bar not found or no scenes');
		}
	}

	/**
	 * Start the main game
	 */
	startMainGame() {
		if (this.gameStarted) {
			return;
		}

		this.gameStarted = true;

		try {
			// Hide cutscene, show game using Bootstrap classes
			const cutsceneContainer = document.getElementById('cutscene-container');
			const gameContainer = document.getElementById('game-container');

			if (cutsceneContainer) {
				cutsceneContainer.classList.add('d-none');
			}

			if (gameContainer) {
				gameContainer.classList.remove('d-none');
			}

			this.gameManager = new GameManager();

			window.game = this.gameManager;
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
	document.addEventListener('DOMContentLoaded', () => {
		new Game();
	});
} else {
	new Game();
}
