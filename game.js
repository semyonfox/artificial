/**
 * Main Game Entry Point
 * Simplified initialization for immediate game start
 */

import { GameManager } from './js/GameManager.js';

class Game {
	constructor() {
		this.gameManager = null;
		this.gameStarted = false;

		this.init();
	}

	/**
	 * Initialize the game immediately
	 */
	init() {
		console.log('🎮 Starting Evolution Clicker...');

		// Show a simple welcome message
		this.showWelcomeScreen();

		// Start game after a short delay
		setTimeout(() => {
			this.startMainGame();
		}, 3000); // 3 seconds instead of 2
	}

	/**
	 * Show welcome screen
	 */
	showWelcomeScreen() {
		console.log('🎬 Showing welcome screen...');

		const cutsceneContainer = document.getElementById('cutscene-container');
		const gameContainer = document.getElementById('game-container');

		console.log('Cutscene container:', cutsceneContainer);
		console.log('Game container:', gameContainer);

		if (cutsceneContainer) {
			cutsceneContainer.classList.remove('hidden');
			cutsceneContainer.style.display = 'flex'; // Force display
			console.log('✅ Cutscene container should now be visible');

			// Add click handler to start game immediately
			cutsceneContainer.addEventListener('click', () => {
				console.log('🖱️ Cutscene clicked, starting game...');
				this.startMainGame();
			});
		} else {
			console.error('❌ Cutscene container not found!');
		}

		if (gameContainer) {
			gameContainer.classList.add('hidden');
			console.log('✅ Game container hidden');
		} else {
			console.error('❌ Game container not found!');
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
			// Hide cutscene, show game
			const cutsceneContainer = document.getElementById('cutscene-container');
			const gameContainer = document.getElementById('game-container');

			console.log('Switching from cutscene to game...');

			if (cutsceneContainer) {
				cutsceneContainer.classList.add('hidden');
				cutsceneContainer.style.display = 'none';
				console.log('✅ Cutscene hidden');
			}

			if (gameContainer) {
				gameContainer.classList.remove('hidden');
				gameContainer.style.display = 'block';
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
      <p>Error: ${error.message}</p>
      <p style="font-size: 0.8em; margin-top: 10px;">Check browser console for details</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">
        Reload Game
      </button>
    `;
		document.body.appendChild(errorDiv);
	}
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	console.log('🌍 DOM loaded, initializing game...');

	try {
		new Game();
	} catch (error) {
		console.error('Failed to initialize game:', error);

		// Fallback error display
		document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: monospace;">
        <div style="text-align: center; padding: 20px; background: #333; border-radius: 8px;">
          <h2>Game Failed to Load</h2>
          <p>Error: ${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
        </div>
      </div>
    `;
	}
});
