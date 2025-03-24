import { GameManager } from './GameManager.js';

/**
 * Manages the cutscene flow and transitions between scenes or eras.
 * Handles auto-progression, manual progression, and era transitions.
 */
export class CutsceneManager {
	constructor() {
		// Select all cutscene elements
		this.scenes = document.querySelectorAll('.scene');
		this.currentSceneIndex = 0; // Tracks the current scene index
		this.autoProgressTimer = null; // Timer for auto-progression
		this.init(); // Initialize the cutscene manager
	}

	/**
	 * Initializes the cutscene manager by showing the first scene
	 * and setting up event listeners for progression.
	 */
	init() {
		this.showScene(0); // Display the first scene

		// Add click event listeners to all "next" buttons in scenes
		document.querySelectorAll('.scene-next').forEach((button) => {
			button.addEventListener('click', () => this.nextScene());
		});

		this.startAutoProgress(); // Start auto-progression for scenes
	}

	/**
	 * Displays a specific scene by index and hides all others.
	 * @param {number} index - The index of the scene to display.
	 */
	showScene(index) {
		this.scenes.forEach((scene, i) => {
			scene.classList.toggle('active', i === index); // Show only the active scene
		});
		this.currentSceneIndex = index; // Update the current scene index
		this.updateProgressBar(); // Update the progress bar
	}

	/**
	 * Updates the progress bar to reflect the current scene's position.
	 */
	updateProgressBar() {
		const progress = ((this.currentSceneIndex + 1) / this.scenes.length) * 100;
		document.documentElement.style.setProperty(
			'--progress-width',
			`${progress}%`
		);
	}

	/**
	 * Advances to the next scene. If the last scene is reached, ends the cutscene.
	 */
	nextScene() {
		if (this.currentSceneIndex < this.scenes.length - 1) {
			this.showScene(this.currentSceneIndex + 1); // Show the next scene
			this.resetAutoProgress(); // Reset auto-progression timer
		} else {
			this.endCutscene(); // End the cutscene if it's the last scene
		}
	}

	/**
	 * Starts auto-progression for scenes, advancing to the next scene after a delay.
	 */
	startAutoProgress() {
		this.autoProgressTimer = setInterval(() => this.nextScene(), 10000); // 10 seconds per scene
	}

	/**
	 * Resets the auto-progression timer and restarts it.
	 */
	resetAutoProgress() {
		clearInterval(this.autoProgressTimer); // Clear the existing timer
		this.startAutoProgress(); // Restart auto-progression
	}

	/**
	 * Ends the cutscene, hides the cutscene container, and shows the game UI.
	 * Initializes the game if it hasn't been started yet.
	 */
	endCutscene() {
		clearInterval(this.autoProgressTimer); // Stop auto-progression
		document.getElementById('cutscene-container').classList.add('hidden'); // Hide cutscene
		document.getElementById('game-container').classList.remove('hidden'); // Show game UI

		// Initialize the game if it hasn't been started
		if (!window.game) {
			window.game = new GameManager();
		}
	}

	/**
	 * Triggers a cutscene for transitioning between eras.
	 * Displays a custom transition message and resets the cutscene flow.
	 * @param {Object} era - The era data containing the name and transition text.
	 */
	triggerEraCutscene(era) {
		const cutsceneContainer = document.getElementById('cutscene-container');
		cutsceneContainer.innerHTML = `
			<div class="scene active">
				<h1>${era.name} Transition</h1>
				<p>${era.transitionText}</p>
				<button class="scene-next">▶️ Continue</button>
			</div>
		`;
		cutsceneContainer.classList.remove('hidden'); // Show the cutscene container
		document.getElementById('game-container').classList.add('hidden'); // Hide the game UI
		this.init(); // Reinitialize the cutscene manager
	}
}
