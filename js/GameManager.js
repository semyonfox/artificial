import { EraRegistry } from '.eras/eraRegistry.js';
import { EraLoader } from './eraLoader.js';
import { GameState } from './state/gameState.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { UIManager } from './systems/UIManager.js';
import { WorkerManager } from './systems/WorkerManager.js';

export class GameManager {
  constructor() {
    this.initializeCoreSystems();
    this.loadSavedGame();
    this.setupEventListeners();
  }

  initializeCoreSystems() {
    // Order matters!
    this.config = new Config(); // Static data first
    this.gameState = new GameState();
    this.eraRegistry = new EraRegistry();
    this.eraLoader = new EraLoader(this.eraRegistry);
    this.resourceManager = new ResourceManager(this.config, this.gameState);
    this.workerManager = new WorkerManager(this.config, this.gameState);
    this.uiManager = new UIManager(this.config, this.gameState);
    this.cutsceneManager = new CutsceneManager();

    console.log('Systems initialized:', this);
  }
}
