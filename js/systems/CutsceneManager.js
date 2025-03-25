import { GameManager } from '../GameManager.js';

export class CutsceneManager {
  constructor() {
    this.domElements = {
      container: document.getElementById('cutscene-container'),
      gameContainer: document.getElementById('game-container'),
      progressBar: document.querySelector('.progress-bar'),
    };

    this.config = {
      autoProgressInterval: 10000, // 10 seconds
      progressBarSelector: '.progress-bar',
      sceneTransitionClass: 'scene-transition',
      eraTransitionTemplate: this.createEraTransitionTemplate(),
    };

    this.state = {
      currentSceneIndex: 0,
      autoProgressTimer: null,
      isEraTransition: false,
      scenes: [],
    };

    this.init();
  }

  init() {
    this.cacheDomElements();
    this.setupEventListeners();
    this.showScene(0);
    this.startAutoProgress();
  }

  cacheDomElements() {
    this.state.scenes = [...document.querySelectorAll('.scene')];
    this.progressBar = document.querySelector(this.config.progressBarSelector);
  }

  setupEventListeners() {
    this.domElements.container.addEventListener('click', (e) => {
      if (e.target.matches('.scene-next, .era-next')) {
        this.handleNextButtonClick();
      }
    });
  }

  handleNextButtonClick() {
    if (this.state.currentSceneIndex < this.state.scenes.length - 1) {
      this.nextScene();
    } else {
      this.endCutscene();
    }
  }

  showScene(index) {
    if (index < 0 || index >= this.state.scenes.length) return;

    this.state.scenes.forEach((scene, i) => {
      scene.classList.toggle('active', i === index);
    });

    this.state.currentSceneIndex = index;
    this.updateProgressBar();
    this.resetAutoProgress();
  }

  updateProgressBar() {
    if (!this.progressBar) return;

    const progress =
      ((this.state.currentSceneIndex + 1) / this.state.scenes.length) * 100;
    this.progressBar.style.width = `${progress}%`;
  }

  nextScene() {
    const nextIndex = this.state.currentSceneIndex + 1;

    if (nextIndex < this.state.scenes.length) {
      this.showScene(nextIndex);
    }
  }

  startAutoProgress() {
    this.clearAutoProgress();
    this.state.autoProgressTimer = setInterval(
      () => this.nextScene(),
      this.config.autoProgressInterval
    );
  }

  resetAutoProgress() {
    this.clearAutoProgress();
    this.startAutoProgress();
  }

  clearAutoProgress() {
    if (this.state.autoProgressTimer) {
      clearInterval(this.state.autoProgressTimer);
      this.state.autoProgressTimer = null;
    }
  }

  endCutscene() {
    this.clearAutoProgress();
    this.toggleContainers(false);

    if (!window.game) {
      window.game = new GameManager();
    }
  }

  toggleContainers(showCutscene = true) {
    this.domElements.container.classList.toggle('hidden', !showCutscene);
    this.domElements.gameContainer.classList.toggle('hidden', showCutscene);
  }

  async triggerEraTransition(eraData) {
    this.state.isEraTransition = true;
    this.toggleContainers(true);

    const transitionScene = this.createEraTransitionScene(eraData);
    this.domElements.container.innerHTML = '';
    this.domElements.container.appendChild(transitionScene);

    this.state.scenes = [transitionScene];
    this.state.currentSceneIndex = 0;
    this.updateProgressBar();
    this.startAutoProgress();
  }

  createEraTransitionScene(eraData) {
    const template = document.createElement('template');
    template.innerHTML = this.config.eraTransitionTemplate
      .replace('{{title}}', eraData.name)
      .replace('{{description}}', eraData.transitionText);

    return template.content.firstElementChild;
  }

  createEraTransitionTemplate() {
    return `
      <div class="scene era-transition active">
        <div class="transition-content">
          <h1 class="era-title">{{title}}</h1>
          <p class="era-description">{{description}}</p>
          <button class="era-next">▶️ Continue</button>
        </div>
      </div>
    `;
  }

  destroy() {
    this.clearAutoProgress();
    this.domElements.container.removeEventListener(
      'click',
      this.handleNextButtonClick
    );
  }
}
