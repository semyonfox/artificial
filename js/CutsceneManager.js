import { GameManager } from './GameManager.js';

export class CutsceneManager {
	constructor() {
		this.scenes = document.querySelectorAll('.scene');
		this.currentSceneIndex = 0;
		this.autoProgressTimer = null;
		this.init();
	}

	init() {
		// Show the first scene
		this.showScene(0);

		// Add event listeners for cutscene progression
		document.querySelectorAll('.scene-next').forEach((button) => {
			button.addEventListener('click', () => this.nextScene());
		});

		// Start auto-progression
		this.startAutoProgress();
	}

	showScene(index) {
		this.scenes.forEach((scene, i) => {
			scene.classList.toggle('active', i === index);
		});
		this.currentSceneIndex = index;
		this.updateProgressBar();
	}

	updateProgressBar() {
		const progress = ((this.currentSceneIndex + 1) / this.scenes.length) * 100;
		document.documentElement.style.setProperty(
			'--progress-width',
			`${progress}%`
		);
	}

	nextScene() {
		if (this.currentSceneIndex < this.scenes.length - 1) {
			this.showScene(this.currentSceneIndex + 1);
			this.resetAutoProgress();
		} else {
			this.endCutscene();
		}
	}

	startAutoProgress() {
		this.autoProgressTimer = setInterval(() => this.nextScene(), 10000);
	}

	resetAutoProgress() {
		clearInterval(this.autoProgressTimer);
		this.startAutoProgress();
	}

	endCutscene() {
		clearInterval(this.autoProgressTimer);
		document.getElementById('cutscene-container').classList.add('hidden');
		document.getElementById('game-container').classList.remove('hidden');
		if (!window.game) {
			window.game = new GameManager(); // Initialize the game after the cutscene
		}
	}

	// New method to trigger era transition cutscenes
	triggerEraCutscene(era) {
		const cutsceneContainer = document.getElementById('cutscene-container');
		cutsceneContainer.innerHTML = `
			<div class="scene active">
				<h1>${era.name} Transition</h1>
				<p>${era.transitionText}</p>
				<button class="scene-next">▶️ Continue</button>
			</div>
		`;
		cutsceneContainer.classList.remove('hidden');
		document.getElementById('game-container').classList.add('hidden');
		this.init();
	}
}
