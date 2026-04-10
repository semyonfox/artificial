# Evolution Clicker Stabilization & Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical bugs, remove dead code, complete era progression for all 12 eras, and add missing features (offline production, achievements, prestige) to make Evolution Clicker a fully playable incremental game.

**Architecture:** The game uses ES6 modules with a central GameManager coordinating ResourceManager, WorkerManager, UIManager, and EventManager systems, all sharing a GameState with observer pattern. Config.js holds all game data. Changes are surgical edits to existing files only.

**Tech Stack:** Vanilla JavaScript (ES modules), Bootstrap 5.3, CSS custom properties, localStorage persistence.

---

## Phase 1: Bug Fixes & Cleanup

### Task 1: Wire onEraTransition into advanceEra

**Files:**
- Modify: `js/GameManager.js:580-626` (advanceEra method)

- [ ] **Step 1: Add onEraTransition call to advanceEra**

In `js/GameManager.js`, inside `advanceEra()`, add the `onEraTransition` call after setting the new era and before resetting progress:

```javascript
// in advanceEra(), after line 601:
// this.gameState.data.currentEra = nextEra;
// ADD:
this.onEraTransition(currentEra, nextEra);
```

The full edit: replace lines 600-604 with:

```javascript
		// Advance the era
		this.gameState.data.currentEra = nextEra;

		// Grant starter resources for the new era
		this.onEraTransition(currentEra, nextEra);

		// Reset era-specific progress
		this.gameState.data.progression.eraProgress = 0;
```

- [ ] **Step 2: Restart worker automation on era change**

Still in `advanceEra()`, after the `updateUI()` call (line 623), add worker restart so workers from the new era can begin:

```javascript
		// Restart worker automation for new era
		this.restartWorkerAutomation();
```

- [ ] **Step 3: Verify in browser**

Run: `python -m http.server 8000` from the project root.
Open `http://localhost:8000`. Use console: `window.game.advanceEra()` after meeting requirements (or temporarily force with `window.game.gameState.data.resources.population = 50`).
Expected: notification about starter resources appears, new era workers/upgrades display.

- [ ] **Step 4: Commit**

```bash
git add js/GameManager.js
git commit -m "wire onEraTransition into advanceEra for starter resources"
```

---

### Task 2: Fix event log — connect EventManager to UIManager

**Files:**
- Modify: `js/systems/EventManager.js:162-165` (logEvent method)

- [ ] **Step 1: Replace console-only logEvent with UIManager call**

In `js/systems/EventManager.js`, replace the `logEvent` method:

```javascript
	/**
	 * Log event to game history and UI
	 */
	logEvent(event) {
		console.log(`Historical Event: ${event.name} - ${event.description}`);

		if (!this.uiManager) return;

		if (event.type === 'disaster') {
			this.uiManager.logDisaster(event);
		} else {
			this.uiManager.logEvent(event);
		}
	}
```

- [ ] **Step 2: Fix UIManager.logEvent to match event data shape**

The `UIManager.logEvent` at line 471 references `event.impact` which doesn't exist on config events (they have `description`). Also `event.effect` is an object, not a string. Replace in `js/systems/UIManager.js`:

```javascript
	/**
	 * Log an event
	 */
	logEvent(event) {
		if (!this.elements.eventLog) return;

		const effectText = event.effect
			? Object.entries(event.effect)
				.map(([resource, change]) => `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}% ${resource}`)
				.join(', ')
			: '';

		const logEntry = document.createElement('div');
		logEntry.className = 'log-entry';
		logEntry.innerHTML = `
      <h4>${event.name}</h4>
      <p>${event.description}</p>
      ${effectText ? `<p class="small text-secondary">Effect: ${effectText}</p>` : ''}
      <small>${new Date().toLocaleTimeString()}</small>
    `;

		this.elements.eventLog.prepend(logEntry);
	}
```

- [ ] **Step 3: Fix UIManager.logDisaster similarly**

```javascript
	/**
	 * Log a disaster
	 */
	logDisaster(disaster) {
		if (!this.elements.disasterLog) return;

		const effectText = disaster.effect
			? Object.entries(disaster.effect)
				.map(([resource, change]) => `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}% ${resource}`)
				.join(', ')
			: '';

		const logEntry = document.createElement('div');
		logEntry.className = 'log-entry disaster';
		logEntry.innerHTML = `
      <h4>${disaster.name}</h4>
      <p>${disaster.description}</p>
      ${effectText ? `<p class="small text-secondary">Effect: ${effectText}</p>` : ''}
      <small>${new Date().toLocaleTimeString()}</small>
    `;

		this.elements.disasterLog.prepend(logEntry);
	}
```

- [ ] **Step 4: Commit**

```bash
git add js/systems/EventManager.js js/systems/UIManager.js
git commit -m "connect event log to UI, fix event data shape mismatch"
```

---

### Task 3: Fix log toggle — replace d-none/collapsed mismatch

**Files:**
- Modify: `js/systems/UIManager.js:151-163` (initLogMenu and toggleLogMenu)

- [ ] **Step 1: Fix toggle to use d-none (matching HTML)**

The HTML at `index.html:146` uses `d-none` on `#log-menu`. But `initLogMenu` adds `collapsed` and `toggleLogMenu` toggles `collapsed`. Fix both methods to use `d-none`:

```javascript
	/**
	 * Initialize log menu
	 */
	initLogMenu() {
		// log menu starts hidden via d-none in HTML, no extra init needed
	}

	/**
	 * Toggle log menu visibility
	 */
	toggleLogMenu() {
		if (this.elements.logMenu) {
			this.elements.logMenu.classList.toggle('d-none');
		}
	}
```

- [ ] **Step 2: Commit**

```bash
git add js/systems/UIManager.js
git commit -m "fix log toggle to use d-none matching HTML markup"
```

---

### Task 4: Fix progress bars — update width in updateEraProgression

**Files:**
- Modify: `js/systems/UIManager.js:423-432` (updateEraProgression method)
- Modify: `js/core/config.js` (read `maxPopulationPerEra` for calculation)

- [ ] **Step 1: Calculate and render progress bar width**

Replace `updateEraProgression` in `js/systems/UIManager.js`:

```javascript
	/**
	 * Update era progression display and advancement button
	 */
	updateEraProgression() {
		const canAdvance = this.gameState.canAdvanceEra();
		const currentEra = this.gameState.data.currentEra;
		const population = this.gameState.getResource('population');
		const maxPop = config.balance?.maxPopulationPerEra?.[currentEra] || 100;

		// calculate progress as percentage of population toward era max
		const progressPercent = Math.min(100, (population / maxPop) * 100);

		// update all progress bars (sidebar + top bar)
		document.querySelectorAll('.progress-bar').forEach((bar) => {
			// skip cutscene progress bar
			if (bar.closest('#cutscene-container')) return;
			bar.style.width = `${progressPercent.toFixed(1)}%`;
		});

		// update progress text
		const progressText = document.querySelector('.progress-text');
		if (progressText) {
			progressText.textContent = `${Math.floor(population)} / ${maxPop} population`;
		}

		// update advance button
		if (!this.elements.nextEraButton) return;
		this.elements.nextEraButton.disabled = !canAdvance;
		this.elements.nextEraButton.classList.toggle('btn-success', canAdvance);
		this.elements.nextEraButton.classList.toggle('btn-secondary', !canAdvance);
		this.elements.nextEraButton.style.display = 'block';
		this.elements.nextEraButton.textContent = canAdvance ? 'Advance Era' : 'Advance Era (requirements not met)';
		this.elements.nextEraButton.classList.toggle('affordable', canAdvance);
	}
```

- [ ] **Step 2: Commit**

```bash
git add js/systems/UIManager.js
git commit -m "fix progress bars to show population toward era max"
```

---

### Task 5: Fix game loop timer — replace modulo pattern with accumulators

**Files:**
- Modify: `js/GameManager.js:13-23` (constructor, add accumulator fields)
- Modify: `js/GameManager.js:148-189` (update method)

- [ ] **Step 1: Add accumulator fields to constructor**

In `js/GameManager.js` constructor, after `this.gameState = null;` (line 19), add:

```javascript
		// periodic task accumulators (ms)
		this.uiUpdateAccum = 0;
		this.eraCheckAccum = 0;
		this.validateAccum = 0;
```

- [ ] **Step 2: Replace modulo checks with accumulator logic in update()**

Replace the periodic check blocks (lines 172-185) in the `update` method:

```javascript
		// Update UI periodically (every 1 second)
		this.uiUpdateAccum += deltaTime;
		if (this.uiUpdateAccum >= 1000) {
			this.uiUpdateAccum -= 1000;
			this.updateUI();
		}

		// Check for era advancement (every 10 seconds)
		this.eraCheckAccum += deltaTime;
		if (this.eraCheckAccum >= 10000) {
			this.eraCheckAccum -= 10000;
			this.checkEraAdvancement();
		}

		// Validate game state periodically (every 5 seconds)
		this.validateAccum += deltaTime;
		if (this.validateAccum >= 5000) {
			this.validateAccum -= 5000;
			this.gameState.validate();
		}
```

- [ ] **Step 3: Commit**

```bash
git add js/GameManager.js
git commit -m "replace fragile modulo timer with accumulators in game loop"
```

---

### Task 6: Delete dead code

**Files:**
- Delete: `js/afk.js`
- Modify: `js/systems/WorkerManager.js` (remove dead methods)
- Modify: `js/systems/UIManager.js` (remove empty placeholder)
- Modify: `js/core/config.js` (remove unused data sections)

- [ ] **Step 1: Delete orphaned afk.js**

```bash
rm js/afk.js
```

- [ ] **Step 2: Remove dead methods from WorkerManager**

In `js/systems/WorkerManager.js`, delete the `feedWorker` method (lines 249-277) and `produceResources` method (lines 282-312). Also delete the duplicate `stopAllWorkerAutomations` method (lines 335-340) — keep `stopAllWorkers` (lines 345-351) since that's what `destroy()` and `restartAllWorkers` actually call.

Wait — `destroy()` at line 445 calls `stopAllWorkerAutomations`. We need to update that too. Change `destroy()` to call `stopAllWorkers` instead:

```javascript
	/**
	 * Cleanup all worker systems
	 */
	destroy() {
		this.stopAllWorkers();
	}
```

Then delete `stopAllWorkerAutomations` (lines 335-340), `feedWorker` (lines 249-277), and `produceResources` (lines 282-312).

- [ ] **Step 3: Remove empty updateWorkerProgress from UIManager**

In `js/systems/UIManager.js`, delete the `updateWorkerProgress` placeholder (lines 510-513):

```javascript
	// DELETE THIS:
	updateWorkerProgress(workerType, progress, maxProgress) {
		// This method can be implemented for worker progress visualization
		// For now, it's a placeholder
	}
```

- [ ] **Step 4: Remove unused config sections**

In `js/core/config.js`, delete these unused data blocks:
- `techTree` (lines 173-248) — never read at runtime; actual upgrade data lives in `eraData[era].upgrades`
- `buildingsByEra` (lines 251-264) — never referenced
- `workersByEra` (lines 267-280) — redundant with `eraData[era].workers`
- `crafting` (lines 283-288) — never referenced
- `eraRequirements` (lines 291-303) — never read at runtime
- `activeResourcesByEra` (lines 158-171) — never referenced

Keep `balance.eraProgressionRequirements` since `GameState.canAdvanceEra()` reads it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "remove dead code: afk.js, unused config sections, dead methods"
```

---

### Task 7: Remove stale build artifacts

**Files:**
- Delete: `dist/bundle.js`
- Modify: `rollup.config.js` (fix stale path comment)

- [ ] **Step 1: Delete stale bundle**

```bash
rm -rf dist/
```

The HTML loads `game.js` directly via `<script type="module">`, so the bundle isn't used.

- [ ] **Step 2: Fix rollup config comment**

In `rollup.config.js`, the file likely has a stale path. Read and fix it.

- [ ] **Step 3: Add dist/ to .gitignore**

Create or update `.gitignore`:

```
dist/
node_modules/
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "remove stale dist bundle, add .gitignore"
```

---

## Phase 2: Complete Era Progression

### Task 8: Add eraData for the 6 missing eras

**Files:**
- Modify: `js/core/config.js` (add eraData entries for classical, medieval, renaissance, space, galactic, universal)

Currently `config.eraData` has: paleolithic, neolithic, bronze, iron, industrial, information. Missing: classical, medieval, renaissance, space, galactic, universal.

- [ ] **Step 1: Add classical era data**

In `js/core/config.js`, after the `iron` eraData entry (after line 795), insert:

```javascript
        classical: {
            id: 'classical',
            name: 'Classical Era',
            timespan: '600 BCE - 500 CE',
            description: 'Greece and Rome bring philosophy, mathematics, medicine, and large-scale engineering.',
            advancementCost: { population: 1200, cities: 30, knowledge: 50 },
            workers: [
                {
                    id: 'architect',
                    name: 'Architect',
                    description: 'Designs aqueducts, roads, and public buildings.',
                    cost: { cities: 15, knowledge: 10, iron: 20 },
                    produces: { engineering: 2, aqueducts: 0.5 },
                    interval: 15000,
                    requiresUpgrade: 'civilEngineering',
                },
                {
                    id: 'philosopher',
                    name: 'Philosopher',
                    description: 'Advances knowledge through systematic inquiry.',
                    cost: { knowledge: 20, cities: 5 },
                    produces: { philosophy: 2, mathematics: 1, knowledge: 1 },
                    interval: 18000,
                    requiresUpgrade: 'philosophySchools',
                },
                {
                    id: 'physician',
                    name: 'Physician',
                    description: 'Studies and treats disease, improving population health.',
                    cost: { knowledge: 15, medicine: 5 },
                    produces: { medicine: 2, population: 0.05 },
                    interval: 20000,
                    requiresUpgrade: 'classicalMedicine',
                },
            ],
            upgrades: [
                {
                    id: 'civilEngineering',
                    name: 'Civil Engineering',
                    description: 'Plan and build large-scale infrastructure',
                    cost: { iron: 12, coins: 10 },
                    effect: 'Unlocks architects and aqueduct construction',
                    priority: 1,
                    historical: 'Roman engineering produced roads, aqueducts, and the Colosseum.',
                },
                {
                    id: 'philosophySchools',
                    name: 'Philosophy Schools',
                    description: 'Establish centers of learning and debate',
                    cost: { writing: 10, knowledge: 15 },
                    effect: 'Unlocks philosophers and accelerates knowledge',
                    priority: 2,
                    historical: "Plato's Academy (387 BCE) was the first institution of higher learning.",
                },
                {
                    id: 'classicalMedicine',
                    name: 'Medicine',
                    description: 'Systematic study of health and disease',
                    cost: { knowledge: 20, philosophy: 10 },
                    effect: 'Unlocks physicians and boosts population growth',
                    priority: 3,
                    historical: 'Hippocrates (460 BCE) is considered the father of medicine.',
                },
                {
                    id: 'classicalMathematics',
                    name: 'Mathematics',
                    description: 'Develop geometry, algebra, and number theory',
                    cost: { writing: 12, philosophy: 8 },
                    effect: 'Improves engineering and knowledge production',
                    priority: 4,
                    historical: "Euclid's Elements (300 BCE) shaped mathematics for two millennia.",
                },
            ],
        },
```

- [ ] **Step 2: Add medieval era data**

```javascript
        medieval: {
            id: 'medieval',
            name: 'Medieval Era',
            timespan: '500 - 1500 CE',
            description: 'Feudalism, mills, guilds, manuscript culture, and castles define a millennium.',
            advancementCost: { population: 3000, manuscripts: 50, guilds: 30 },
            workers: [
                {
                    id: 'miller',
                    name: 'Miller',
                    description: 'Operates water and wind mills to process grain.',
                    cost: { agriculture: 20, mills: 5 },
                    produces: { mills: 1, agriculture: 2 },
                    interval: 10000,
                    requiresUpgrade: 'watermills',
                },
                {
                    id: 'monk',
                    name: 'Monk',
                    description: 'Copies manuscripts and preserves knowledge.',
                    cost: { manuscripts: 10, religion: 5 },
                    produces: { manuscripts: 2, knowledge: 1, religion: 0.5 },
                    interval: 15000,
                    requiresUpgrade: 'scriptoria',
                },
                {
                    id: 'guildMaster',
                    name: 'Guild Master',
                    description: 'Organizes crafts and improves trade quality.',
                    cost: { guilds: 10, coins: 15 },
                    produces: { guilds: 1, trade: 2 },
                    interval: 12000,
                    requiresUpgrade: 'guildSystem',
                },
            ],
            upgrades: [
                {
                    id: 'heavyPlow',
                    name: 'Heavy Plow',
                    description: 'Iron-tipped plows for dense soils',
                    cost: { iron: 8, agriculture: 15 },
                    effect: 'Greatly improves agricultural output',
                    priority: 1,
                    historical: 'The heavy plow (6th century) transformed Northern European farming.',
                },
                {
                    id: 'watermills',
                    name: 'Water & Wind Mills',
                    description: 'Harness natural forces for mechanical power',
                    cost: { stones: 15, iron: 10 },
                    effect: 'Unlocks millers and mechanized production',
                    priority: 2,
                    historical: 'By 1086, England had over 6,000 water mills recorded in Domesday Book.',
                },
                {
                    id: 'guildSystem',
                    name: 'Guild System',
                    description: 'Organize craftsmen into professional associations',
                    cost: { coins: 12, trade: 8 },
                    effect: 'Unlocks guild masters and improves trade',
                    priority: 3,
                    historical: 'Merchant guilds emerged in the 11th century across Europe.',
                },
                {
                    id: 'scriptoria',
                    name: 'Scriptoria',
                    description: 'Establish manuscript copying workshops',
                    cost: { manuscripts: 8, knowledge: 10 },
                    effect: 'Unlocks monks and preserves knowledge',
                    priority: 4,
                    historical: 'Monastic scriptoria preserved classical texts through the Dark Ages.',
                },
            ],
        },
```

- [ ] **Step 3: Add renaissance era data**

```javascript
        renaissance: {
            id: 'renaissance',
            name: 'Renaissance',
            timespan: '1300 - 1600 CE',
            description: 'A rebirth of learning brings printing, banking, navigation, and scientific inquiry.',
            advancementCost: { population: 10000, printing: 100, banking: 50 },
            workers: [
                {
                    id: 'printer',
                    name: 'Printer',
                    description: 'Operates the printing press to mass-produce books.',
                    cost: { printing: 20, manuscripts: 10 },
                    produces: { printing: 3, knowledge: 1 },
                    interval: 8000,
                    requiresUpgrade: 'printingPress',
                },
                {
                    id: 'explorer',
                    name: 'Explorer',
                    description: 'Charts new trade routes and discovers new lands.',
                    cost: { navigation: 15, banking: 10 },
                    produces: { exploration: 2, trade: 2, navigation: 0.5 },
                    interval: 15000,
                    requiresUpgrade: 'renaissanceNavigation',
                },
                {
                    id: 'banker',
                    name: 'Banker',
                    description: 'Manages finances and funds expeditions.',
                    cost: { coins: 20, banking: 5 },
                    produces: { banking: 2, coins: 1, trade: 1 },
                    interval: 10000,
                    requiresUpgrade: 'renaissanceBanking',
                },
            ],
            upgrades: [
                {
                    id: 'printingPress',
                    name: 'Printing Press',
                    description: 'Mechanize book production',
                    cost: { manuscripts: 12, iron: 8 },
                    effect: 'Unlocks printers and accelerates knowledge spread',
                    priority: 1,
                    historical: "Gutenberg's press (1440) revolutionized information distribution.",
                },
                {
                    id: 'renaissanceNavigation',
                    name: 'Navigation',
                    description: 'Develop tools and techniques for ocean voyages',
                    cost: { optics: 10, printing: 8 },
                    effect: 'Unlocks explorers and new trade routes',
                    priority: 2,
                    historical: "The Age of Discovery (15th century) connected the world's continents.",
                },
                {
                    id: 'renaissanceBanking',
                    name: 'Banking',
                    description: 'Create financial institutions for lending and investment',
                    cost: { coins: 20, trade: 10 },
                    effect: 'Unlocks bankers and trade expansion',
                    priority: 3,
                    historical: 'The Medici Bank (1397) pioneered modern banking.',
                },
                {
                    id: 'scientificMethod',
                    name: 'Scientific Method',
                    description: 'Systematic observation and experimentation',
                    cost: { printing: 15, knowledge: 20 },
                    effect: 'Improves all knowledge production',
                    priority: 4,
                    historical: "Galileo and Bacon formalized the scientific method in the 1600s.",
                },
            ],
        },
```

- [ ] **Step 4: Add space era data**

Insert after the `information` eraData entry:

```javascript
        space: {
            id: 'space',
            name: 'Space Age',
            timespan: '1957 - 2100',
            description: 'Humanity reaches beyond Earth with rockets, orbital stations, and fusion research.',
            advancementCost: { population: 1000000, rockets: 500, spaceStations: 50 },
            workers: [
                {
                    id: 'astronaut',
                    name: 'Astronaut',
                    description: 'Crews orbital stations and conducts space research.',
                    cost: { rockets: 50, spaceStations: 10 },
                    produces: { spaceStations: 0.5, robotics: 1, fusion: 0.3 },
                    interval: 15000,
                    requiresUpgrade: 'orbitalHab',
                },
                {
                    id: 'rocketEngineer',
                    name: 'Rocket Engineer',
                    description: 'Designs and builds launch vehicles.',
                    cost: { computers: 30, steel: 50 },
                    produces: { rockets: 2, satellites: 1 },
                    interval: 12000,
                    requiresUpgrade: 'rocketry',
                },
                {
                    id: 'fusionScientist',
                    name: 'Fusion Scientist',
                    description: 'Researches controlled nuclear fusion.',
                    cost: { computers: 40, electricity: 30 },
                    produces: { fusion: 2, solarPanels: 1 },
                    interval: 18000,
                    requiresUpgrade: 'fusionResearch',
                },
            ],
            upgrades: [
                {
                    id: 'rocketry',
                    name: 'Rocketry',
                    description: 'Develop reliable launch vehicles',
                    cost: { steel: 20, computers: 10 },
                    effect: 'Unlocks rocket engineers',
                    priority: 1,
                    historical: 'Sputnik (1957) launched the space age.',
                },
                {
                    id: 'orbitalHab',
                    name: 'Orbital Habitation',
                    description: 'Build permanent stations in orbit',
                    cost: { rockets: 10, satellites: 10 },
                    effect: 'Unlocks astronauts and space stations',
                    priority: 2,
                    historical: 'Skylab (1973) and ISS (1998) proved humans can live in space.',
                },
                {
                    id: 'fusionResearch',
                    name: 'Fusion Research',
                    description: 'Pursue clean, unlimited energy',
                    cost: { computers: 20, electricity: 20 },
                    effect: 'Unlocks fusion scientists',
                    priority: 3,
                    historical: 'ITER aims to demonstrate fusion power by the 2030s.',
                },
                {
                    id: 'spaceRobotics',
                    name: 'Space Robotics',
                    description: 'Automate space construction and mining',
                    cost: { robotics: 10, satellites: 5 },
                    effect: 'Improves all space production',
                    priority: 4,
                    historical: 'Robotic arms on ISS and Mars rovers advanced automation.',
                },
            ],
        },
```

- [ ] **Step 5: Add galactic era data**

```javascript
        galactic: {
            id: 'galactic',
            name: 'Galactic Era',
            timespan: '2100+',
            description: 'Interstellar civilization with Dyson swarms, quantum computing, and antimatter power.',
            advancementCost: { population: 5000000, dysonSpheres: 10, quantumComputers: 50 },
            workers: [
                {
                    id: 'dysonBuilder',
                    name: 'Dyson Builder',
                    description: 'Constructs segments of stellar energy collectors.',
                    cost: { robotics: 30, solarPanels: 50 },
                    produces: { dysonSpheres: 0.5, electricity: 5 },
                    interval: 20000,
                    requiresUpgrade: 'dysonSwarm',
                },
                {
                    id: 'quantumResearcher',
                    name: 'Quantum Researcher',
                    description: 'Pushes the boundaries of computation and physics.',
                    cost: { computers: 50, satellites: 20 },
                    produces: { quantumComputers: 1, darkMatter: 0.5 },
                    interval: 18000,
                    requiresUpgrade: 'quantumComputing',
                },
                {
                    id: 'antimatterEngineer',
                    name: 'Antimatter Engineer',
                    description: 'Produces and contains antimatter for energy.',
                    cost: { fusion: 30, quantumComputers: 10 },
                    produces: { antimatter: 1, wormholes: 0.2 },
                    interval: 15000,
                    requiresUpgrade: 'antimatterContainment',
                },
            ],
            upgrades: [
                {
                    id: 'dysonSwarm',
                    name: 'Dyson Swarm',
                    description: 'Surround a star with energy collectors',
                    cost: { robotics: 20, solarPanels: 30 },
                    effect: 'Unlocks Dyson builders and massive energy',
                    priority: 1,
                    historical: 'Freeman Dyson proposed stellar megastructures in 1960.',
                },
                {
                    id: 'quantumComputing',
                    name: 'Quantum Computing',
                    description: 'Harness quantum mechanics for computation',
                    cost: { computers: 30, satellites: 20 },
                    effect: 'Unlocks quantum researchers',
                    priority: 2,
                    historical: 'Quantum supremacy was first demonstrated in 2019.',
                },
                {
                    id: 'wormholeTheory',
                    name: 'Wormhole Theory',
                    description: 'Understand spacetime shortcuts',
                    cost: { quantumComputers: 10, darkMatter: 5 },
                    effect: 'Enables interstellar travel research',
                    priority: 3,
                    historical: 'Einstein-Rosen bridges were theorized in 1935.',
                },
                {
                    id: 'antimatterContainment',
                    name: 'Antimatter Containment',
                    description: 'Safely store and use antimatter',
                    cost: { fusion: 20, quantumComputers: 5 },
                    effect: 'Unlocks antimatter engineers',
                    priority: 4,
                    historical: 'CERN trapped antihydrogen atoms in 2010.',
                },
            ],
        },
```

- [ ] **Step 6: Add universal era data**

```javascript
        universal: {
            id: 'universal',
            name: 'Universal Era',
            timespan: 'Far Future',
            description: 'Reality manipulation, multiverse access, and consciousness transfer mark the ultimate era.',
            advancementCost: null,
            workers: [
                {
                    id: 'realityArchitect',
                    name: 'Reality Architect',
                    description: 'Reshapes the fabric of spacetime itself.',
                    cost: { quantumComputers: 40, antimatter: 30 },
                    produces: { realityEngines: 1, universalConstants: 0.5 },
                    interval: 20000,
                    requiresUpgrade: 'realityEngineering',
                },
                {
                    id: 'multiverseNavigator',
                    name: 'Multiverse Navigator',
                    description: 'Traverses parallel realities for resources and knowledge.',
                    cost: { wormholes: 20, realityEngines: 5 },
                    produces: { multiverseAccess: 1, existentialEnergy: 1, cosmicStrings: 0.3 },
                    interval: 15000,
                    requiresUpgrade: 'multiversalPhysics',
                },
                {
                    id: 'consciousnessEngineer',
                    name: 'Consciousness Engineer',
                    description: 'Transfers and expands consciousness beyond biological limits.',
                    cost: { quantumComputers: 30, existentialEnergy: 10 },
                    produces: { consciousnessTransfer: 1, population: 0.1 },
                    interval: 18000,
                    requiresUpgrade: 'consciousnessUpload',
                },
            ],
            upgrades: [
                {
                    id: 'realityEngineering',
                    name: 'Reality Engineering',
                    description: 'Manipulate fundamental forces',
                    cost: { quantumComputers: 20, antimatter: 20 },
                    effect: 'Unlocks reality architects',
                    priority: 1,
                    historical: 'Theoretical endpoint of technological civilization.',
                },
                {
                    id: 'multiversalPhysics',
                    name: 'Multiversal Physics',
                    description: 'Access parallel universes',
                    cost: { wormholes: 15, realityEngines: 5 },
                    effect: 'Unlocks multiverse navigators',
                    priority: 2,
                    historical: 'The many-worlds interpretation was proposed by Everett in 1957.',
                },
                {
                    id: 'consciousnessUpload',
                    name: 'Consciousness Transfer',
                    description: 'Upload minds to digital substrates',
                    cost: { quantumComputers: 12, consciousnessTransfer: 5 },
                    effect: 'Unlocks consciousness engineers',
                    priority: 3,
                    historical: 'Mind uploading remains one of the grand challenges of neuroscience.',
                },
            ],
        },
```

- [ ] **Step 7: Register new upgrade keys in GameState.createInitialUpgrades**

In `js/core/GameState.js`, add the new upgrade IDs to `createInitialUpgrades()` so they're tracked:

```javascript
		// Classical upgrades
		civilEngineering: false,
		philosophySchools: false,
		classicalMedicine: false,
		classicalMathematics: false,

		// Medieval upgrades
		heavyPlow: false,
		watermills: false,
		guildSystem: false,
		scriptoria: false,

		// Renaissance upgrades
		printingPress: false,
		renaissanceNavigation: false,
		renaissanceBanking: false,
		scientificMethod: false,

		// Space Age upgrades
		rocketry: false,
		orbitalHab: false,
		fusionResearch: false,
		spaceRobotics: false,

		// Galactic upgrades
		dysonSwarm: false,
		quantumComputing: false,
		wormholeTheory: false,
		antimatterContainment: false,

		// Universal upgrades
		realityEngineering: false,
		multiversalPhysics: false,
		consciousnessUpload: false,
```

- [ ] **Step 8: Register new worker types in config.workerTimers**

In `js/core/config.js`, add entries to `workerTimers` for new workers so `GameState.createInitialWorkers()` picks them up:

```javascript
    workerTimers: {
        gatherer: 8000,
        hunter: 12000,
        cook: 6000,
        craftsman: 10000,
        farmer: 15000,
        miner: 12000,
        scholar: 20000,
        engineer: 25000,
        // neolithic
        potter: 6000,
        herder: 10000,
        // bronze
        metalworker: 12000,
        scribe: 15000,
        merchant: 10000,
        // iron
        blacksmith: 10000,
        // classical
        architect: 15000,
        philosopher: 18000,
        physician: 20000,
        // medieval
        miller: 10000,
        monk: 15000,
        guildMaster: 12000,
        // renaissance
        printer: 8000,
        explorer: 15000,
        banker: 10000,
        // industrial
        factoryWorker: 8000,
        inventor: 12000,
        // information
        programmer: 6000,
        networkEngineer: 10000,
        // space
        astronaut: 15000,
        rocketEngineer: 12000,
        fusionScientist: 18000,
        // galactic
        dysonBuilder: 20000,
        quantumResearcher: 18000,
        antimatterEngineer: 15000,
        // universal
        realityArchitect: 20000,
        multiverseNavigator: 15000,
        consciousnessEngineer: 18000,
    },
```

- [ ] **Step 9: Commit**

```bash
git add js/core/config.js js/core/GameState.js
git commit -m "add eraData, worker timers, and upgrade keys for all 12 eras"
```

---

### Task 9: Replace generic era progression gate with eraData.advancementCost

**Files:**
- Modify: `js/core/GameState.js:290-318` (canAdvanceEra method)

- [ ] **Step 1: Rewrite canAdvanceEra to use advancementCost from eraData**

Replace the `canAdvanceEra` method in `js/core/GameState.js`:

```javascript
	/**
	 * Check if era advancement is possible using eraData.advancementCost
	 */
	canAdvanceEra() {
		const currentEra = this.data.currentEra;
		const eraData = config.eraData[currentEra];

		if (!eraData || !eraData.advancementCost) return false;

		return this.canAfford(eraData.advancementCost);
	}
```

- [ ] **Step 2: Deduct advancementCost when advancing**

In `js/GameManager.js`, inside `advanceEra()`, after the `canAdvanceEra` check and before setting the new era, spend the advancement cost:

```javascript
		// Spend advancement cost
		const eraData = this.getCurrentEraData();
		if (eraData.advancementCost) {
			this.gameState.spendResources(eraData.advancementCost);
		}
```

Insert this between the `canAdvanceEra` check (line 597) and the era change (line 601).

- [ ] **Step 3: Delete legacy eraProgressionRequirements from config**

In `js/core/config.js`, remove the `eraProgressionRequirements` block from `config.balance`:

```javascript
		// DELETE:
		eraProgressionRequirements: {
			populationMultiplier: 1.5,
			resourceDiversity: 0.7,
			upgradeCompletion: 0.6
		}
```

- [ ] **Step 4: Update progress bar to use advancementCost**

In `js/systems/UIManager.js`, update `updateEraProgression` to show progress toward the advancement cost rather than just population. Replace the progress calculation:

```javascript
	updateEraProgression() {
		const currentEra = this.gameState.data.currentEra;
		const eraData = config.eraData[currentEra];
		const canAdvance = this.gameState.canAdvanceEra();

		// calculate progress as average fulfillment of advancementCost
		let progressPercent = 0;
		if (eraData?.advancementCost) {
			const entries = Object.entries(eraData.advancementCost);
			const fulfillments = entries.map(([resource, required]) => {
				const current = this.gameState.getResource(resource);
				return Math.min(1, current / required);
			});
			progressPercent = (fulfillments.reduce((a, b) => a + b, 0) / fulfillments.length) * 100;
		} else {
			progressPercent = 100;
		}

		// update all progress bars
		document.querySelectorAll('.progress-bar').forEach((bar) => {
			if (bar.closest('#cutscene-container')) return;
			bar.style.width = `${progressPercent.toFixed(1)}%`;
		});

		// update progress text
		const progressText = document.querySelector('.progress-text');
		if (progressText) {
			if (eraData?.advancementCost) {
				const costText = Object.entries(eraData.advancementCost)
					.map(([r, amt]) => `${Math.floor(this.gameState.getResource(r))}/${amt} ${r}`)
					.join(', ');
				progressText.textContent = costText;
			} else {
				progressText.textContent = 'Final era reached';
			}
		}

		// update advance button
		if (!this.elements.nextEraButton) return;
		this.elements.nextEraButton.disabled = !canAdvance;
		this.elements.nextEraButton.classList.toggle('btn-success', canAdvance);
		this.elements.nextEraButton.classList.toggle('btn-secondary', !canAdvance);
		this.elements.nextEraButton.style.display = 'block';
		this.elements.nextEraButton.textContent = canAdvance ? 'Advance Era' : 'Advance Era (requirements not met)';
		this.elements.nextEraButton.classList.toggle('affordable', canAdvance);
	}
```

- [ ] **Step 5: Commit**

```bash
git add js/core/GameState.js js/GameManager.js js/core/config.js js/systems/UIManager.js
git commit -m "replace generic era gate with advancementCost, show cost in progress bar"
```

---

### Task 10: Fix direct .data mutation to use proper state API

**Files:**
- Modify: `js/core/GameState.js` (add setEra and addPlayTime methods)
- Modify: `js/GameManager.js` (use new methods instead of direct mutation)

- [ ] **Step 1: Add setEra method to GameState**

In `js/core/GameState.js`, after the `unlockUpgrade` method:

```javascript
	/**
	 * Set the current era and notify listeners
	 */
	setEra(newEra) {
		const oldEra = this.data.currentEra;
		this.data.currentEra = newEra;
		this.data.progression.eraProgress = 0;
		this.notifyListeners('eraAdvancement', { oldEra, newEra });
	}
```

- [ ] **Step 2: Update GameManager.advanceEra to use setEra**

In `js/GameManager.js`, replace the direct mutations in `advanceEra()`:

Replace:
```javascript
		this.gameState.data.currentEra = nextEra;
		// ...
		this.gameState.data.progression.eraProgress = 0;
		// ...
		this.gameState.notifyListeners('eraAdvancement', { ... });
```

With:
```javascript
		this.gameState.setEra(nextEra);
```

- [ ] **Step 3: Use addResource for play time tracking or keep direct (acceptable)**

The `totalPlayTime` mutation in `update()` happens every frame. Adding a method call per frame for this is overkill — keep the direct write since no listener needs it. Leave as is.

- [ ] **Step 4: Commit**

```bash
git add js/core/GameState.js js/GameManager.js
git commit -m "add setEra API method, stop bypassing listener system"
```

---

## Phase 3: New Features

### Task 11: Offline production system

**Files:**
- Create: `js/systems/OfflineManager.js`
- Modify: `js/GameManager.js` (import and wire OfflineManager)

- [ ] **Step 1: Create OfflineManager**

Create `js/systems/OfflineManager.js`:

```javascript
/**
 * Offline Manager - Calculates and applies resource production while player was away
 */

import { config } from '../core/config.js';

export class OfflineManager {
	constructor(gameState) {
		this.gameState = gameState;

		// save timestamp on unload
		window.addEventListener('beforeunload', () => {
			localStorage.setItem('lastActive', Date.now().toString());
		});
	}

	/**
	 * Calculate and apply offline production. Call once on game load.
	 * Returns summary object or null if no meaningful offline time.
	 */
	applyOfflineProduction(gameManager) {
		const lastActive = localStorage.getItem('lastActive');
		if (!lastActive) {
			localStorage.setItem('lastActive', Date.now().toString());
			return null;
		}

		const offlineMs = Date.now() - parseInt(lastActive);
		localStorage.setItem('lastActive', Date.now().toString());

		// ignore if less than 1 minute
		if (offlineMs < 60000) return null;

		const eraData = gameManager.getCurrentEraData();
		if (!eraData?.workers) return null;

		const gameData = this.gameState.getState();
		const produced = {};

		eraData.workers.forEach((workerData) => {
			const count = gameData.workers[workerData.id] || 0;
			if (count <= 0 || !workerData.produces) return;

			const interval = workerData.interval || 10000;
			const cycles = Math.floor(offlineMs / interval);

			// offline workers run at 50% efficiency (no food management)
			const efficiency = 0.5;

			Object.entries(workerData.produces).forEach(([resource, basePerWorker]) => {
				const amount = Math.floor(basePerWorker * count * cycles * efficiency);
				if (amount > 0) {
					this.gameState.addResource(resource, amount);
					produced[resource] = (produced[resource] || 0) + amount;
				}
			});
		});

		if (Object.keys(produced).length === 0) return null;

		return {
			offlineMinutes: Math.floor(offlineMs / 60000),
			produced,
		};
	}

	/**
	 * Save current timestamp
	 */
	saveTimestamp() {
		localStorage.setItem('lastActive', Date.now().toString());
	}
}
```

- [ ] **Step 2: Wire OfflineManager into GameManager**

In `js/GameManager.js`, add import:

```javascript
import { OfflineManager } from './systems/OfflineManager.js';
```

In `initializeSystems()`, add:

```javascript
		this.systems.offlineManager = new OfflineManager(this.gameState);
```

After the initial UI update in `initialize()` (after `this.updateUI();`), add:

```javascript
			// Apply offline production
			const offlineResult = this.systems.offlineManager.applyOfflineProduction(this);
			if (offlineResult) {
				const resourceText = Object.entries(offlineResult.produced)
					.map(([r, amt]) => `${amt} ${r}`)
					.join(', ');
				this.systems.uiManager?.showNotification(
					`Welcome back! (${offlineResult.offlineMinutes}m away) Workers produced: ${resourceText}`,
					'success',
					6000
				);
			}
```

- [ ] **Step 3: Commit**

```bash
git add js/systems/OfflineManager.js js/GameManager.js
git commit -m "add offline production system"
```

---

### Task 12: Save export/import

**Files:**
- Modify: `index.html` (add export/import buttons)
- Modify: `js/GameManager.js` (add exportSave and importSave methods)
- Modify: `js/systems/UIManager.js` (wire buttons)

- [ ] **Step 1: Add buttons to HTML**

In `index.html`, inside the era-card after the next-era-button (line 61), add:

```html
                        <div class="d-flex gap-2 mt-2">
                            <button id="save-button" class="btn btn-sm btn-ghost flex-grow-1">Save</button>
                            <button id="export-button" class="btn btn-sm btn-ghost flex-grow-1">Export</button>
                            <button id="import-button" class="btn btn-sm btn-ghost flex-grow-1">Import</button>
                            <button id="reset-button" class="btn btn-sm btn-ghost text-danger flex-grow-1">Reset</button>
                        </div>
```

- [ ] **Step 2: Add export/import methods to GameManager**

In `js/GameManager.js`:

```javascript
	/**
	 * Export save as base64 string to clipboard
	 */
	exportSave() {
		try {
			const saveData = localStorage.getItem(config.storage.saveKey);
			if (!saveData) {
				this.systems.uiManager?.showNotification('No save data to export', 'warning');
				return;
			}
			const encoded = btoa(saveData);
			navigator.clipboard.writeText(encoded).then(() => {
				this.systems.uiManager?.showNotification('Save exported to clipboard!', 'success');
			});
		} catch (error) {
			console.error('Export failed:', error);
			this.systems.uiManager?.showNotification('Export failed', 'error');
		}
	}

	/**
	 * Import save from base64 string
	 */
	importSave(encoded) {
		try {
			const decoded = atob(encoded.trim());
			JSON.parse(decoded); // validate it's valid JSON
			localStorage.setItem(config.storage.saveKey, decoded);
			this.loadGame();
			this.systems.uiManager?.showNotification('Save imported!', 'success');
		} catch (error) {
			console.error('Import failed:', error);
			this.systems.uiManager?.showNotification('Invalid save data', 'error');
		}
	}
```

- [ ] **Step 3: Wire buttons in UIManager**

In `js/systems/UIManager.js`, add to `cacheElements`:

```javascript
				saveButton: document.getElementById('save-button'),
				exportButton: document.getElementById('export-button'),
				importButton: document.getElementById('import-button'),
				resetButton: document.getElementById('reset-button'),
```

Add to `addEventListeners`:

```javascript
		if (this.elements.saveButton) {
			this.elements.saveButton.addEventListener('click', () => this.gameManager.saveGame());
		}

		if (this.elements.exportButton) {
			this.elements.exportButton.addEventListener('click', () => this.gameManager.exportSave());
		}

		if (this.elements.importButton) {
			this.elements.importButton.addEventListener('click', () => {
				const encoded = prompt('Paste your exported save data:');
				if (encoded) this.gameManager.importSave(encoded);
			});
		}

		if (this.elements.resetButton) {
			this.elements.resetButton.addEventListener('click', () => this.gameManager.resetGame());
		}
```

- [ ] **Step 4: Commit**

```bash
git add index.html js/GameManager.js js/systems/UIManager.js
git commit -m "add save/export/import/reset buttons"
```

---

## Phase 4: Polish

### Task 13: Reduce cook burn chance for early game

**Files:**
- Modify: `js/core/config.js` (burnChance value)

- [ ] **Step 1: Lower burn chance from 50% to 30%**

In `js/core/config.js`, change:

```javascript
        burnChance: 0.5,
```

To:

```javascript
        burnChance: 0.3,
```

- [ ] **Step 2: Commit**

```bash
git add js/core/config.js
git commit -m "reduce cook burn chance from 50% to 30%"
```

---

### Task 14: Clean up excessive console.log statements

**Files:**
- Modify: all JS files (remove debug-level console.log calls, keep error/warn)

- [ ] **Step 1: Remove initialization and debug logs**

Remove `console.log` calls that are just initialization noise:
- `GameManager.js`: "GameManager created", "Initializing game systems...", "Game initialized successfully", "Advanced from X to Y", etc.
- `GameState.js`: "GameState initialized", "Game saved successfully", "Game loaded successfully", "Game state reset"
- `WorkerManager.js`: "WorkerManager initialized", "All worker automation stopped", "Worker automation restarted"
- `ResourceManager.js`: "ResourceManager initialized"
- `EventManager.js`: "EventManager initialized"
- `UIManager.js`: "UIManager initialized"
- `game.js`: all the emoji-prefixed debug logs

Keep `console.error` and `console.warn` calls — those are useful.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "remove debug console.log noise, keep error and warn"
```

---

### Task 15: Fix rollup build for production

**Files:**
- Modify: `package.json` (add terser plugin)
- Modify: `rollup.config.js` (add minification, fix comment)

- [ ] **Step 1: Install rollup terser plugin**

```bash
cd /home/semyon/code/personal/artificial && pnpm add -D @rollup/plugin-terser
```

- [ ] **Step 2: Update rollup config**

```javascript
import terser from '@rollup/plugin-terser';

export default {
    input: './game.js',
    output: {
        file: './dist/bundle.js',
        format: 'iife',
        name: 'Game',
        sourcemap: true,
    },
    plugins: [terser()],
};
```

- [ ] **Step 3: Build and verify**

```bash
pnpm run build
```

Expected: `dist/bundle.js` and `dist/bundle.js.map` created without errors.

- [ ] **Step 4: Update .gitignore to allow dist for deployment**

Remove `dist/` from `.gitignore` if the game needs to be served as a static site, or keep it ignored if deploying from source. Decision: keep dist/ ignored since HTML loads source modules directly.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml rollup.config.js
git commit -m "update rollup config with minification and source maps"
```
