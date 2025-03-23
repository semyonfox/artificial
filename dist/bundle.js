(function () {
	'use strict';

	// config.js
	const config = {
		eras: {
			prehistoric: { order: 1 },
			stoneAge: { order: 2 },
			bronzeAge: { order: 3 },
			ironAge: { order: 4 },
			industrialAge: { order: 5 },
			informationAge: { order: 6 },
			stellarDominion: { order: 7 },
			galacticFederation: { order: 8 },
			universalAscendancy: { order: 9 },
		},

		workerTimers: {
			forager: 5000,
			hunter: 6000,
			cook: 4000,
			farmer: 8000,
			potter: 6500,
			copperMiner: 7000,
			tinTrader: 7500,
			scribe: 9000,
			blacksmith: 8500,
			soldier: 6000,
			coalMiner: 7000,
			engineer: 8000,
			factoryWorker: 5000,
			programmer: 6500,
			solarEngineer: 10000,
			swarmBot: 12000,
			singularityEngineer: 15000,
			voidMiner: 14000,
			realityArchitect: 20000,
			chronoEngineer: 25000,
		},

		yields: {
			baseHuntYield: 1,
			baseGatherYield: 1,
		},

		probabilities: {
			burnChance: 0.2,
			stoneChanceFromSticks: 0.3,
			furDropChance: 0.1,
			boneDropChance: 1.0,
			wolfAttackChance: 0.25,
			tinShortageChance: 0.3,
			conquestChance: 0.2,
			barbarianInvasionChance: 0.5,
			goldenAgeChance: 0.1,
			industrialAccidentChance: 0.25,
			exportBoomChance: 0.15,
		},

		workerBonuses: {
			fireControl: 0.5, // Reduces burn chance
			boneTools: 1, // Additional sticks/stones
			irrigation: 2, // Grain multiplier
			bronzeCasting: 2, // Bronze production
			blastFurnace: 2, // Steel multiplier
			steamEngine: 3, // Factory output
			quantumComputing: 10, // Data processing
		},

		gameVariables: {
			resourceEfficiency: 1.0,
			foodProduction: 1.0,
			populationGrowth: 1.0,
			researchSpeed: 1.0,
			tradeEfficiency: 1.0,
			productionSpeed: 1.0,
			militaryStrength: 1.0,
			defense: 1.0,
			happiness: 1.0,
			safety: 3.0,
			tradeRoutes: 0,
			entropy: 0,
		},

		resourceIcons: {
			// Basic Resources
			sticks: '🪵',
			stones: '🪨',
			rawMeat: '🥩',
			cookedMeat: '🍗',
			fur: '🟫',
			bones: '🦴',

			// Stone Age
			grain: '🌾',
			clay: '🏺',
			pottery: '⚱️',

			// Bronze Age
			copper: '🔶',
			tin: '🔹',
			bronze: '🔨',
			clayTablets: '📜',

			// Iron Age
			iron: '⚙️',
			steel: '🛠️',
			grainSurplus: '🌾🌾',

			// Industrial
			coal: '⛏️',
			steamParts: '💨',
			factoryGoods: '🏭',

			// Information Age
			silicon: '🔌',
			energy: '⚡',
			data: '💾',

			// Stellar
			solarPlasma: '☀️',
			dysonSwarm: '🛸',

			// Galactic
			darkMatter: '🌌',
			singularityCores: '🕳️',

			// Universal
			entropy: '🎲',
			cosmicStrings: '🌠',

			// Special
			population: '👥',
			defense: '🛡️',
			research: '📚',
		},

		progressionRequirements: {
			prehistoric: { population: 50 },
			stoneAge: { grain: 1000 },
			bronzeAge: { bronze: 200 },
			ironAge: { steel: 500 },
			industrialAge: { factoryGoods: 1000 },
			informationAge: { data: 5000 },
			stellarDominion: { dysonSwarm: 100 },
			galacticFederation: { darkMatter: 1e6 },
			universalAscendancy: { entropy: -100 },
		},
	};

	class ResourceManager {
		constructor(state, updateProgressCallback, uiManager) {
			this.state = state;
			this.updateProgress = updateProgressCallback;
			this.uiManager = uiManager;
		}

		gatherResource(resourceType, baseYield, workerType, bonusKey, chanceKey) {
			let fedWorkers = 0;
			const workers = this.state.workers[workerType];
			for (let i = 0; i < workers; i++) {
				if (this.state.resources.cookedMeat >= 1) {
					this.state.resources.cookedMeat -= 1; // Deduct cooked meat for each worker
					fedWorkers++;
				}
			}
			this.state.workers[workerType] = fedWorkers;

			const bonus = fedWorkers * (config.workerBonuses[bonusKey] || 0); // Use config for bonuses
			const chanceBonus =
				chanceKey && Math.random() < (config.probabilities[chanceKey] || 0) // Use config for probabilities
					? 1
					: 0;

			const efficiencyMultiplier =
				resourceType === 'meat'
					? config.gameVariables.meatProduction
					: resourceType === 'food'
					? config.gameVariables.foodProduction
					: 1;

			this.state.resources[resourceType] +=
				(baseYield + bonus + chanceBonus) * efficiencyMultiplier;
			this.updateProgress(1);
			this.uiManager.updateUI();

			if (resourceType === 'meat') {
				// Always give 1 bone per hunt
				this.state.resources.bones = (this.state.resources.bones || 0) + 1;

				// Randomly give 0-3 fur
				const furYield = Math.floor(Math.random() * 4); // Random between 0 and 3
				this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

				this.uiManager.showNotification(
					`You hunted and got 1 bone and ${furYield} fur!`,
					'success'
				);
			}
		}

		gather(resourceType, baseYield, workerType, bonusKey, chanceKey = null) {
			this.gatherResource(
				resourceType,
				baseYield,
				workerType,
				bonusKey,
				chanceKey
			);

			if (resourceType === 'meat') {
				// Always give 1 bone per hunt
				this.state.resources.bones = (this.state.resources.bones || 0) + 1;

				// Randomly give fur based on the configured drop chance
				if (Math.random() < config.probabilities.furDropChance) {
					const furYield = Math.floor(Math.random() * 4) + 1; // Random between 1 and 4
					this.state.resources.fur = (this.state.resources.fur || 0) + furYield;

					this.uiManager.showNotification(
						`You hunted and got 1 bone and ${furYield} fur!`,
						'success'
					);
				} else {
					this.uiManager.showNotification(
						`You hunted and got 1 bone but no fur this time.`,
						'info'
					);
				}
			}
		}

		gatherSticks() {
			this.gather(
				'sticks',
				1 + (this.state.upgrades.stickEfficiency || 0), // Apply stick efficiency upgrade
				'woodcutter',
				'workerBonusStick',
				'stoneChanceFromSticks'
			);
		}

		mineStone() {
			this.gather(
				'stones',
				1 + (this.state.upgrades.stoneEfficiency || 0), // Apply stone efficiency upgrade
				'miner',
				'workerBonusStone'
			);
		}

		huntAnimal() {
			this.gather('meat', config.yields.huntYield, 'hunter', 'workerBonusMeat');
		}

		craftClothes() {
			if (this.state.resources.fur >= 5) {
				this.state.resources.fur -= 5;
				this.state.resources.clothes = (this.state.resources.clothes || 0) + 1;
				this.uiManager.showNotification('You crafted clothes!', 'success');
			} else {
				this.uiManager.showNotification(
					'Not enough fur to craft clothes!',
					'error'
				);
			}
		}

		applyClothesToWorker(workerType) {
			if (
				this.state.resources.clothes > 0 &&
				this.state.workers[workerType] > 0
			) {
				this.state.resources.clothes -= 1;
				config.workerBonuses[
					`workerBonus${workerType.charAt(0).toUpperCase() + workerType.slice(1)}`
				] *= 2;
				this.uiManager.showNotification(
					`${
					workerType.charAt(0).toUpperCase() + workerType.slice(1)
				} efficiency doubled!`,
					'success'
				);
			} else {
				this.uiManager.showNotification(
					'No clothes available or no workers to apply to!',
					'error'
				);
			}
		}

		cookMeatClick() {
			const cookEfficiency = this.state.upgrades.cookEfficiency || 1; // Base cooking efficiency
			let cookedCount = 0;

			if (this.state.resources.meat > 0) {
				// Cook meat manually
				for (
					let i = 0;
					i < cookEfficiency && this.state.resources.meat > 0;
					i++
				) {
					this.state.resources.meat -= 1;
					if (Math.random() >= config.probabilities.burnChance) {
						this.state.resources.cookedMeat += 1;
						cookedCount++;
					} else {
						this.uiManager.showNotification('A piece of meat burned!', 'warning');
					}
				}

				// Let cook workers assist
				const cooks = this.state.workers.cook || 0;
				for (let i = 0; i < cooks; i++) {
					if (this.state.resources.meat > 0) {
						this.state.resources.meat -= 1;
						if (Math.random() >= config.probabilities.burnChance) {
							this.state.resources.cookedMeat += 1;
							cookedCount++;
						} else {
							this.uiManager.showNotification(
								'A piece of meat burned!',
								'warning'
							);
						}
					}
				}

				this.uiManager.showNotification(
					`You successfully cooked ${cookedCount} meat!`,
					'success'
				);
				this.updateProgress(1);
				this.uiManager.updateUI();
			} else {
				this.uiManager.showNotification('No raw meat to cook!', 'error');
			}
		}

		forage() {
			const stickYield = 1 + (this.state.upgrades.stickEfficiency || 0); // Apply stick efficiency upgrade
			const stoneChance =
				Math.random() < config.probabilities.stoneChanceFromSticks; // Use centralized stone chance
			const stoneYield = stoneChance
				? 1 + (this.state.upgrades.stoneEfficiency || 0)
				: 0;

			this.state.resources.sticks += stickYield;
			if (stoneYield > 0) {
				this.state.resources.stones += stoneYield;
				this.uiManager.showNotification('You found a stone!', 'success', 1000);
			}

			this.uiManager.updateUI();
		}
	}

	class UIManager {
		constructor(state, gameManager) {
			this.state = state;
			this.gameManager = gameManager;
			this.cacheElements();
			this.addEventListeners();
			this.initLogMenu();
		}

		cacheElements() {
			this.elements = {
				forageButton: document.getElementById('forage-button'),
				huntButton: document.getElementById('hunt-button'),
				cookButton: document.getElementById('cook-button'),
				resourceDisplay: document.getElementById('resource-display'),
				upgradesContainer: document.getElementById('upgrades'), // For upgrades
				itemsContainer: document.getElementById('items'), // Add a new container for items
				eraDisplay: document.getElementById('era-display'),
				hireButtons: {
					woodcutter: document.getElementById('hire-woodcutter'),
					miner: document.getElementById('hire-miner'),
					hunter: document.getElementById('hire-hunter'),
					cook: document.getElementById('hire-cook'),
				},
				workerStatus: document.getElementById('worker-status'),
				logMenu: document.getElementById('log-menu'),
				logToggle: document.getElementById('log-toggle'),
				eventLog: document.getElementById('event-log'),
				disasterLog: document.getElementById('disaster-log'),
				notificationContainer: document.getElementById('notification-container'),
				eraDetails: document.getElementById('era-details'), // Add this line
			};
		}

		addEventListeners() {
			this.elements.forageButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.forageButton,
					() => this.gameManager.resourceManager.forage(),
					100
				)
			);
			this.elements.huntButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.huntButton,
					() => this.gameManager.findFood(),
					120
				)
			);
			this.elements.cookButton.addEventListener('click', () =>
				this.gameManager.performAction(
					this.elements.cookButton,
					() => this.gameManager.resourceManager.cookMeatClick(),
					80
				)
			);
			Object.entries(this.elements.hireButtons).forEach(([type, button]) =>
				button.addEventListener('click', () => this.gameManager.hireWorker(type))
			);
			this.elements.logToggle.addEventListener('click', () => {
				this.elements.logMenu.classList.toggle('collapsed');
			});
		}

		initLogMenu() {
			this.elements.logMenu.classList.add('collapsed'); // Start collapsed
		}

		updateUI() {
			this.updateResources();
			this.updateEraDisplay();

			// Merge items and upgrades into a single list for rendering
			const eraData = this.gameManager.eraData[this.state.age];
			const elements = [...(eraData?.upgrades || []), ...(eraData?.items || [])];
			this.renderElements(
				elements,
				this.elements.upgradesContainer,
				'upgrade-item'
			);

			this.updateButtons();
			this.updateWorkerStatus();
		}

		updateResources() {
			this.elements.resourceDisplay.innerHTML = Object.entries(
				this.state.resources
			)
				.filter(([_, val]) => val > 0) // Only display resources with a value greater than 0
				.map(
					([key, val]) =>
						`<div class="resource">${
						config.resourceIcons[key] || key
					} ${Math.floor(val)}</div>` // Use config for icons
				)
				.join('');
		}

		updateEraDisplay() {
			this.elements.eraDisplay.textContent = `Era: ${
			this.gameManager.eraData[this.state.age]?.name || 'Unknown'
		}`;
		}

		updateEraDetails(era) {
			this.elements.eraDetails.innerHTML = `
			<h2>${era.name}</h2>
			<p>${era.dateRange}</p>
			<ul>
				${era.keyFeatures.map((feature) => `<li>${feature}</li>`).join('')}
			</ul>
		`;
		}

		updateButtons() {
			this.elements.huntButton.classList.toggle(
				'hidden',
				!this.state.upgrades[config.upgradeDefinitions.spear.unlocks[0]] // Use config for unlocks
			);
			this.elements.cookButton.classList.toggle(
				'hidden',
				!this.state.upgrades[config.upgradeDefinitions.fire.unlocks[0]] // Use config for unlocks
			);
			Object.entries(this.elements.hireButtons).forEach(([type, button]) => {
				button.textContent = `Hire ${
				type.charAt(0).toUpperCase() + type.slice(1)
			} (${this.gameManager.workerManager.getWorkerCost(type).cookedMeat} ${
				config.resourceIcons.cookedMeat
			})`; // Use config for icons
			});
			this.elements.logToggle.style.display = 'block';
		}

		updateWorkerStatus() {
			this.elements.workerStatus.textContent = Object.entries(this.state.workers)
				.map(
					([type, count]) =>
						`${type.charAt(0).toUpperCase() + type.slice(1)}s: ${count || 0}`
				)
				.join(', ');
		}

		renderElements(elements, container, type) {
			container.innerHTML = '';
			if (!elements) return;

			elements.forEach((element) => {
				const currentCount = this.state.upgrades[`${element.id}_count`] || 0;
				const remainingCount = element.maxCount
					? element.maxCount - currentCount
					: Infinity;
				const canAfford = this.gameManager.canAfford(element.cost);

				const elementEl = document.createElement('div');
				elementEl.className = `upgrade-item ${
				remainingCount <= 0 ? 'maxed-out' : canAfford ? 'available' : 'locked'
			}`;
				elementEl.innerHTML = `
				<h3>${element.name}</h3>
				<p>${element.description}</p>
				<div>Cost: ${this.formatCost(element.cost)}</div>
				<div>Remaining: ${remainingCount}</div>
				<button ${remainingCount <= 0 ? 'disabled' : ''} class="${
				remainingCount <= 0 ? 'maxed' : canAfford ? 'buyable' : 'unaffordable'
			}">
					${remainingCount <= 0 ? 'Maxed Out' : 'Buy'}
				</button>
			`;
				elementEl.querySelector('button').addEventListener('click', () => {
					if (type === 'upgrade-item') {
						this.gameManager.buyUpgrade(element.id);
					} else {
						this.gameManager.buyItem(element.id);
					}
				});
				container.appendChild(elementEl);
			});
		}

		formatCost(cost) {
			return Object.entries(cost)
				.map(
					([resource, amount]) =>
						`${amount} ${config.resourceIcons[resource] || resource}` // Use config for icons
				)
				.join(', ');
		}

		getIcon(resource) {
			return config.resourceIcons[resource] || resource; // Use centralized icons
		}

		logEvent(event) {
			const logEntry = document.createElement('div');
			logEntry.className = 'log-entry';
			logEntry.innerHTML = `
			<h4>${event.name}</h4>
			<p>${event.impact}</p>
			<p>Effect: ${event.effect}</p>
		`;
			this.elements.eventLog.appendChild(logEntry);
			this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight; // Auto-scroll to the latest log
		}

		logDisaster(disaster) {
			const logEntry = document.createElement('div');
			logEntry.className = 'log-entry';
			logEntry.innerHTML = `
			<h4>${disaster.name}</h4>
			<p>${disaster.impact}</p>
			<p>Effect: ${disaster.effect}</p>
		`;
			this.elements.disasterLog.appendChild(logEntry);
			this.elements.disasterLog.scrollTop =
				this.elements.disasterLog.scrollHeight; // Auto-scroll to the latest log
		}

		showNotification(message, type = 'success', duration = 2000) {
			const notification = document.createElement('div');
			notification.className = `notification ${type}`;
			notification.textContent = message;

			this.elements.notificationContainer.appendChild(notification);

			// Remove the notification after the specified duration
			setTimeout(() => {
				notification.remove();
			}, duration);
		}

		updateWorkerProgress(workerType, duration, totalDuration) {
			let progressBar = document.querySelector(`#${workerType}-progress`);
			if (!progressBar) {
				// Create a new progress bar if it doesn't exist
				progressBar = document.createElement('div');
				progressBar.id = `${workerType}-progress`;
				progressBar.className = 'worker-progress-bar';
				this.elements.workerStatus.appendChild(progressBar);
			}

			// Update the progress bar's width and animation
			progressBar.style.transition = `width ${duration}ms linear`;
			progressBar.style.width = `${(duration / totalDuration) * 100}%`;

			// Remove the progress bar when the task is complete
			if (duration === 0) {
				setTimeout(() => progressBar.remove(), totalDuration);
			}
		}
	}

	class WorkerManager {
		constructor(state, uiManager, updateUI) {
			this.state = state;
			this.uiManager = uiManager;
			this.updateUI = updateUI;
			this.workerIntervals = {};
		}

		startWorkerTask(workerType, resourceType, baseYield, bonusKey) {
			if (this.workerIntervals[workerType]) {
				clearInterval(this.workerIntervals[workerType]);
			}
			const baseTimer = config.workerTimers[workerType];
			const timer = Math.max(
				1000,
				baseTimer * (1 - (this.state.upgrades.efficiency || 0) * 0.1)
			);

			// Create or update the progress bar for this worker type
			this.uiManager.updateWorkerProgress(workerType, 0, timer);

			this.workerIntervals[workerType] = setInterval(() => {
				this.performWorkerAction(workerType, resourceType, baseYield, bonusKey);

				// Reset the progress bar after each action
				this.uiManager.updateWorkerProgress(workerType, 0, timer);
			}, timer);

			// Start the progress bar animation
			this.uiManager.updateWorkerProgress(workerType, timer, timer);
		}

		performWorkerAction(workerType, resourceType, baseYield, bonusKey) {
			let totalYield = 0;
			let unfedWorkers = 0;

			for (let i = 0; i < this.state.workers[workerType]; i++) {
				if (this.state.resources.cookedMeat >= 1) {
					this.state.resources.cookedMeat--;
					totalYield += baseYield + (config.workerBonuses[bonusKey] || 0);
				} else if (resourceType === 'bones' && this.state.resources.bones >= 1) {
					this.state.resources.bones--; // Deduct bones if used as a resource
					totalYield += baseYield;
				} else if (resourceType === 'fur' && this.state.resources.fur >= 1) {
					this.state.resources.fur--; // Deduct fur if used as a resource
					totalYield += baseYield;
				} else {
					unfedWorkers++;
				}
			}

			if (unfedWorkers > 0) {
				this.uiManager.showNotification(
					`${unfedWorkers} ${workerType}(s) couldn't work due to lack of food.`,
					'error'
				);
			}

			this.state.resources[resourceType] += totalYield;
			this.updateUI();
		}

		startAllWorkerTasks() {
			this.startWorkerTask('woodcutter', 'sticks', 1, 'workerBonusStick');
			this.startWorkerTask('miner', 'stones', 1, 'workerBonusStone');
			this.startWorkerTask(
				'hunter',
				'meat',
				config.yields.huntYield,
				'workerBonusMeat'
			);
			this.startWorkerTask('cook', 'cookedMeat', 2, 'workerBonusCook');
		}

		getWorkerCost(workerType) {
			const baseCost = { cookedMeat: 10 }; // Base cost for hiring a worker
			const multiplier = 1.5; // Cost multiplier for each additional worker
			const workerCount = this.state.workers[workerType] || 0;

			// Calculate the cost dynamically for each resource
			const cost = {};
			Object.entries(baseCost).forEach(([resource, amount]) => {
				cost[resource] = Math.ceil(amount * Math.pow(multiplier, workerCount));
			});
			return cost;
		}

		hireWorker(workerType) {
			const cost = this.getWorkerCost(workerType);

			// Check if the player can afford the worker
			const canAfford = Object.entries(cost).every(
				([resource, amount]) => this.state.resources[resource] >= amount
			);

			if (canAfford) {
				// Deduct the resources
				Object.entries(cost).forEach(([resource, amount]) => {
					this.state.resources[resource] -= amount;
				});

				// Increment the worker count
				this.state.workers[workerType] =
					(this.state.workers[workerType] || 0) + 1;

				// Start or update the automated task for the worker
				this.startWorkerTask(workerType, resourceType, baseYield, bonusKey);

				// Update the UI
				this.updateUI();
			}
		}

		triggerWorkerAction(workerType, resourceType, baseYield, bonusKey) {
			this.performWorkerAction(workerType, resourceType, baseYield, bonusKey);
		}
	}

	const gameProgressionData = {
		eras: {
			prehistoric: {
				name: 'Prehistoric Era',
				dateRange: '2.5M BCE - 10,000 BCE',
				keyResources: ['sticks', 'stones', 'rawMeat', 'fur', 'bones'],
				keyFeatures: ['Basic stone tools', 'Hunting & gathering', 'Fire mastery'],
				workers: {
					forager: { cost: { meat: 3 }, effect: { sticks: 1, stones: 0.3 } },
					hunter: { cost: { sticks: 5 }, effect: { rawMeat: 1, bones: 0.5 } },
					cook: { cost: { stones: 3 }, effect: { cookedMeat: 1 } },
				},
				upgrades: [
					{
						name: 'Fire Control',
						effect: 'Reduces meat burning chance by 50%',
						cost: { sticks: 30, stones: 20 },
					},
					{
						name: 'Bone Tools',
						effect: '+1 stick/stone per gather',
						cost: { bones: 15 },
					},
				],
				events: [
					{
						name: 'Wolf Attack!',
						effect: 'Lose 1 hunter (25% chance)',
						trigger: { action: 'hunting', chance: 0.25 },
					},
				],
				transitionText:
					'Mastering fire and tools leads to settled communities...',
			},

			stoneAge: {
				name: 'Stone Age',
				dateRange: '10,000 BCE - 3,000 BCE',
				keyResources: ['grain', 'clay', 'pottery'],
				keyFeatures: [
					'Agriculture development',
					'Permanent settlements',
					'Domestication',
				],
				workers: {
					farmer: { cost: { cookedMeat: 5 }, effect: { grain: 2 } },
					potter: { cost: { clay: 3 }, effect: { pottery: 1 } },
				},
				upgrades: [
					{
						name: 'Irrigation',
						effect: 'Double grain production',
						cost: { pottery: 5, sticks: 20 },
					},
				],
				transitionText: 'Farming surplus enables civilization...',
			},

			bronzeAge: {
				name: 'Bronze Age',
				dateRange: '3300 BCE - 1200 BCE',
				keyResources: ['copper', 'tin', 'bronze', 'clayTablets'],
				keyFeatures: [
					'Alloy metallurgy',
					'Early writing systems',
					'Trade networks',
				],
				workers: {
					copperMiner: { cost: { tools: 2 }, effect: { copper: 3 } },
					tinTrader: { cost: { bronze: 1 }, effect: { tin: 2 } },
					scribe: { cost: { clayTablets: 1 }, effect: { research: 0.5 } },
				},
				upgrades: [
					{
						name: 'Bronze Casting',
						effect: '1 copper + 1 tin → 2 bronze',
						cost: { clayTablets: 5 },
					},
					{
						name: 'Trade Routes',
						effect: 'Double tin acquisition',
						cost: { bronze: 20 },
					},
				],
				events: [
					{
						name: 'Tin Shortage',
						effect: 'Tin production halved for 1h',
						trigger: { resource: 'tin', chance: 0.3 },
					},
					{
						name: 'Conquest',
						effect: 'Gain 100 bronze instantly',
						trigger: { military: 3, chance: 0.2 },
					},
				],
				transitionText:
					'Mastery of metalworking forges the path to empire building...',
			},

			ironAge: {
				name: 'Iron Age',
				dateRange: '1200 BCE - 500 CE',
				keyResources: ['iron', 'steel', 'grainSurplus'],
				keyFeatures: [
					'Iron tools/weapons',
					'Empire expansion',
					'Currency systems',
				],
				workers: {
					blacksmith: { cost: { iron: 5 }, effect: { steel: 1 } },
					farmer: { cost: { tools: 1 }, effect: { grainSurplus: 3 } },
					soldier: { cost: { steel: 2 }, effect: { defense: 5 } },
				},
				upgrades: [
					{
						name: 'Blast Furnace',
						effect: 'Double steel production',
						cost: { iron: 100, coal: 50 },
					},
					{
						name: 'Imperial Roads',
						effect: '50% faster resource transport',
						cost: { stone: 500 },
					},
				],
				events: [
					{
						name: 'Barbarian Invasion',
						effect: 'Lose 20% resources (50% chance)',
						trigger: {
							condition: 'defenseLessThan',
							threshold: 5,
							chance: 0.5,
						},
					},
					{
						name: 'Golden Age',
						effect: 'All production +25% for 2h',
						trigger: {
							condition: 'happinessGreaterThan',
							threshold: 80,
							chance: 0.1,
						},
					},
				],
				transitionText:
					'Iron mastery and imperial administration birth lasting civilizations...',
			},

			industrialAge: {
				name: 'Industrial Age',
				dateRange: '1760 CE - 1940 CE',
				keyResources: ['coal', 'steamParts', 'factoryGoods'],
				keyFeatures: ['Steam power', 'Mass production', 'Global trade'],
				workers: {
					coalMiner: { cost: { tools: 5 }, effect: { coal: 10 } },
					engineer: { cost: { steel: 3 }, effect: { steamParts: 2 } },
					factoryWorker: { cost: { coal: 5 }, effect: { factoryGoods: 4 } },
				},
				upgrades: [
					{
						name: 'Steam Engine',
						effect: 'Triple factory output',
						cost: { steamParts: 50, iron: 200 },
					},
					{
						name: 'Rail Network',
						effect: 'Double trade efficiency',
						cost: { steel: 1000, coal: 500 },
					},
				],
				events: [
					{
						name: 'Industrial Accident',
						effect: 'Lose 10% workers',
						trigger: {
							condition: 'safetyLessThan',
							threshold: 3,
							chance: 0.25,
						},
					},
					{
						name: 'Export Boom',
						effect: 'Double trade income for 24h',
						trigger: {
							condition: 'tradeRoutesGreaterThan',
							threshold: 5,
							chance: 0.15,
						},
					},
				],
				transitionText:
					'The roar of machinery propels humanity into the technological age...',
			},
			informationAge: {
				name: 'Information Age',
				dateRange: '1990 CE - 2040 CE',
				keyResources: ['silicon', 'energy', 'data'],
				keyFeatures: ['Global internet', 'Digital revolution', 'Early AI'],
				workers: {
					programmer: { cost: { energy: 10 }, effect: { data: 5 } },
					engineer: { cost: { silicon: 3 }, effect: { energy: 2 } },
				},
				upgrades: [
					{
						name: 'Quantum Computing',
						effect: '10x data processing',
						cost: { silicon: 100, energy: 500 },
					},
				],
				transitionText: 'Digital networks connect humanity globally...',
			},

			stellarDominion: {
				name: 'Stellar Dominion (Type I)',
				dateRange: '2200 CE - 3000 CE',
				keyResources: ['solarPlasma', 'dysonSwarm'],
				keyFeatures: [
					'Dyson sphere construction',
					'Planetary engineering',
					'Star harvesting',
				],
				workers: {
					solarEngineer: { cost: { energy: 1000 }, effect: { solarPlasma: 10 } },
					swarmBot: { cost: { solarPlasma: 50 }, effect: { dysonSwarm: 1 } },
				},
				upgrades: [
					{
						name: 'Fusion Containment',
						effect: 'Double plasma yield',
						cost: { dysonSwarm: 5 },
					},
				],
				transitionText:
					"Harnessing a star's full energy enables galactic expansion...",
			},

			galacticFederation: {
				name: 'Galactic Federation (Type II)',
				dateRange: '3000 CE - 10,000 CE',
				keyResources: ['darkMatter', 'singularityCores'],
				keyFeatures: [
					'Black hole engineering',
					'Galactic civilization',
					'Matter transmutation',
				],
				workers: {
					singularityEngineer: {
						cost: { darkMatter: 1 },
						effect: { singularityCores: 0.1 },
					},
					voidMiner: { cost: { singularityCores: 1 }, effect: { darkMatter: 5 } },
				},
				transitionText:
					'Mastering galactic resources unlocks universal control...',
			},

			universalAscendancy: {
				name: 'Universal Ascendancy (Type III)',
				dateRange: '10,000 CE+',
				keyResources: ['entropy', 'cosmicStrings'],
				keyFeatures: [
					'Multiverse travel',
					'Entropy reversal',
					'Reality engineering',
				],
				workers: {
					realityArchitect: {
						cost: { cosmicStrings: 1 },
						effect: { entropy: -0.1 },
					},
					chronoEngineer: { cost: { entropy: 10 }, effect: { cosmicStrings: 1 } },
				},
				transitionText:
					'Transcending spacetime itself, humanity becomes eternal...',
			},
		}};

	class GameManager {
		constructor() {
			// Initialize game state
			this.state = {
				resources: {
					sticks: 0,
					stones: 0,
					meat: 0,
					cookedMeat: 0,
					bones: 0, // Initialize bones
					fur: 0, // Initialize fur
				},
				upgrades: {},
				age: 'prehistoric',
				progress: 0,
				workers: {
					woodcutter: 0,
					miner: 0,
					hunter: 0,
					cook: 0,
				},
			};

			// Ensure all resources are initialized to 0
			Object.keys(config.workerBonuses).forEach((resource) => {
				if (!(resource in this.state.resources)) {
					this.state.resources[resource] = 0;
				}
			});

			// Initialize managers
			this.uiManager = new UIManager(this.state, this);
			this.resourceManager = new ResourceManager(
				this.state,
				this.updateProgress.bind(this),
				this.uiManager
			);
			this.workerManager = new WorkerManager(
				this.state,
				this.uiManager,
				this.uiManager.updateUI.bind(this.uiManager)
			);

			// Load era data
			this.eraData = gameProgressionData.eras;
			this.currentEra = 'prehistoric';

			// Timers for events and disasters
			this.eventTimer = null;
			this.disasterTimer = null;

			// Initialize the game
			this.initEra();
			this.startGameLoop();
		}

		// ------------------------------
		// Era Management
		// ------------------------------

		// Initialize the current era
		initEra() {
			const era = this.eraData[this.currentEra];
			if (!era) return;

			this.uiManager.updateEraDetails(era);
			this.uiManager.updateUI();
			this.scheduleRandomEvent();
			this.scheduleRandomDisaster();
		}

		// Transition to the next era
		advanceToNextEra() {
			const eras = Object.keys(this.eraData);
			const currentIndex = eras.indexOf(this.currentEra);
			if (currentIndex < eras.length - 1) {
				this.currentEra = eras[currentIndex + 1];
				this.initEra();
			}
		}

		// ------------------------------
		// Event and Disaster Management
		// ------------------------------

		// Schedule a random event
		scheduleRandomEvent() {
			clearTimeout(this.eventTimer);
			const era = this.eraData[this.currentEra];
			if (!era || !era.events || era.events.length === 0) return;

			this.eventTimer = setTimeout(() => {
				const randomEvent =
					era.events[Math.floor(Math.random() * era.events.length)];
				this.processEvent(randomEvent);
				this.scheduleRandomEvent();
			}, Math.random() * 90000 + 90000); // Random interval between 90-180 seconds
		}

		// Schedule a random disaster
		scheduleRandomDisaster() {
			clearTimeout(this.disasterTimer);
			const era = this.eraData[this.currentEra];
			if (!era || !era.disasters || era.disasters.length === 0) return;

			this.disasterTimer = setTimeout(() => {
				const randomDisaster =
					era.disasters[Math.floor(Math.random() * era.disasters.length)];
				this.processDisaster(randomDisaster);
				this.scheduleRandomDisaster();
			}, Math.random() * 120000 + 120000); // Random interval between 120-240 seconds
		}

		// Process an event
		processEvent(event) {
			this.uiManager.logEvent(event);
			this.applyEffect(event.effect);
			this.uiManager.updateUI();
		}

		// Process a disaster
		processDisaster(disaster) {
			this.uiManager.logDisaster(disaster);
			this.applyEffect(disaster.effect);
			this.uiManager.updateUI();
		}

		// ------------------------------
		// Resource and Upgrade Management
		// ------------------------------

		// Apply effects to the game state
		applyEffect(effect) {
			Object.entries(effect).forEach(([key, value]) => {
				if (key in this.state.resources) {
					this.state.resources[key] += this.state.resources[key] * value;
				} else if (key in config) {
					// Handle workerBonuses, probabilities, workerTimers, and gameVariables dynamically
					if (config[key][key]) {
						config[key][key] += value;
					}
				} else if (key === 'unlockFeature') {
					this.state.upgrades[value] = true;
				} else if (key === 'population') {
					this.adjustPopulation(value);
				} else if (key === 'defense') {
					this.state.defense = (this.state.defense || 0) + value;
				} else if (key === 'attackPower') {
					this.state.attackPower = (this.state.attackPower || 0) + value;
				}
			});
		}

		// Adjust population and handle worker limits
		adjustPopulation(value) {
			this.state.population = Math.floor((this.state.population || 0) + value);
			if (this.state.population < 0) {
				Object.keys(this.state.workers).forEach((workerType) => {
					this.state.workers[workerType] = Math.max(
						0,
						this.state.workers[workerType] + this.state.population
					);
				});
				this.state.population = 0;
			}
		}

		// Apply the effects of an upgrade or item
		applyUpgradeOrItemEffect(effect) {
			if (effect.unlocks) {
				effect.unlocks.forEach((feature) => {
					this.state.upgrades[feature] = true;

					const era = this.eraData[this.state.age];
					if (era) {
						if (era.items?.some((item) => item.id === feature)) {
							this.state.upgrades[`${feature}_unlocked`] = true;
						} else if (feature === 'hunting') {
							this.state.upgrades.hunting_unlocked = true;
						} else if (feature === 'cooking') {
							this.state.upgrades.cooking_unlocked = true;
						}
					}
				});
			}
			if (effect.buff || effect) {
				this.applyEffect(effect.buff || effect);
			}
			this.uiManager.updateUI();
		}

		// Update the progress of the current era and transition to the next era if needed
		updateProgress(increment) {
			this.state.progress += increment;
			const eras = Object.keys(this.eraData);
			const currentIndex = eras.indexOf(this.currentEra);
			if (currentIndex < eras.length - 1) {
				const nextEra = eras[currentIndex + 1];
				if (this.state.progress >= config.ages[nextEra]) {
					// Check if all upgrades and items are bought
					const currentEraData = this.eraData[this.currentEra];
					const allUpgradesBought = currentEraData.upgrades.every(
						(upgrade) =>
							(this.state.upgrades[`${upgrade.id}_count`] || 0) >=
							(upgrade.maxCount || 1)
					);
					const allItemsBought = currentEraData.items.every(
						(item) =>
							(this.state.upgrades[`${item.id}_count`] || 0) >=
							(item.maxCount || 1)
					);

					if (allUpgradesBought && allItemsBought) {
						// Trigger the cutscene for the next era
						this.uiManager.cutsceneManager.triggerEraCutscene(
							this.eraData[nextEra]
						);
						this.currentEra = nextEra; // Transition to the next era
						this.initEra(); // Initialize the new era
					}
				}
			}
		}

		// Purchase an upgrade
		buyUpgrade(id) {
			const upgrade = this.getUpgradeById(id);
			if (!upgrade || !this.canAfford(upgrade.cost)) {
				this.uiManager.showNotification('Cannot afford this upgrade!', 'error');
				return;
			}

			const currentCount = this.state.upgrades[`${id}_count`] || 0;
			if (currentCount >= (upgrade.maxCount || 1)) {
				this.uiManager.showNotification('Upgrade is maxed out!', 'error');
				return;
			}

			this.deductResources(upgrade.cost);
			this.applyUpgradeOrItemEffect(upgrade.effect || {});
			this.incrementUpgradeCount(id);

			this.uiManager.showNotification(`${upgrade.name} purchased!`, 'success');
			this.uiManager.updateUI();
		}

		// Apply the effects of an upgrade based on its level
		applyUpgradeEffect(upgrade, level) {
			if (upgrade.effectPerLevel) {
				Object.entries(upgrade.effectPerLevel).forEach(([stat, value]) => {
					this.state[stat] = (this.state[stat] || 0) + value * level;
				});
			}
		}

		// Purchase the maximum number of upgrades possible
		buyMax(id) {
			while (this.canAffordUpgrade(id)) {
				this.buyUpgrade(id);
			}
		}

		// Check if an upgrade can be afforded
		canAffordUpgrade(upgrade) {
			if (!upgrade || !upgrade.cost) return false;
			return Object.entries(upgrade.cost).every(
				([r, a]) => this.state.resources[r] >= a
			);
		}

		// Purchase an item if resources are sufficient
		buyItem(id) {
			const item = this.getItemById(id);
			if (!item || !this.canAfford(item.cost)) {
				this.uiManager.showNotification('Cannot afford this item!', 'error');
				return;
			}

			const currentCount = this.state.upgrades[`${id}_count`] || 0;
			if (currentCount >= (item.maxCount || 1)) {
				this.uiManager.showNotification('Item is maxed out!', 'error');
				return;
			}

			// Deduct resources and apply effects
			this.deductResources(item.cost);
			this.applyUpgradeOrItemEffect(item.effect || {});
			this.incrementUpgradeCount(id);

			this.uiManager.showNotification(`${item.name} purchased!`, 'success');
			this.uiManager.updateUI();
		}

		// Check if an item can be afforded
		canAffordItem(item) {
			if (!item || !item.cost) return false;
			return Object.entries(item.cost).every(
				([r, a]) => this.state.resources[r] >= a
			);
		}

		getUpgradeById(id) {
			return gameProgressionData.upgrades[id];
		}

		getItemById(id) {
			return gameProgressionData.items[id];
		}

		canAfford(cost) {
			return Object.entries(cost).every(
				([resource, amount]) => (this.state.resources[resource] || 0) >= amount
			);
		}

		deductResources(cost) {
			Object.entries(cost).forEach(([resource, amount]) => {
				if ((this.state.resources[resource] || 0) >= amount) {
					this.state.resources[resource] -= amount;
				} else {
					throw new Error(`Not enough ${resource} to complete the transaction.`);
				}
			});
		}

		incrementUpgradeCount(id) {
			this.state.upgrades[`${id}_count`] =
				(this.state.upgrades[`${id}_count`] || 0) + 1;
		}

		// Find food and add it to the resources
		findFood() {
			const foodReward = Math.floor(Math.random() * 4) + 2;
			this.state.resources.meat += foodReward;
			this.uiManager.updateUI();
		}

		// ------------------------------
		// Worker Management
		// ------------------------------

		// Hire a worker of a specific type if resources are sufficient
		hireWorker(workerType) {
			const baseCost = config.workerTimers[workerType] || 10; // Use config for base cost
			const multiplier = 1.5;
			const workerCount = this.state.workers[workerType] || 0;

			const cost = Math.ceil(baseCost * Math.pow(multiplier, workerCount));

			if (this.state.resources.cookedMeat >= cost) {
				this.state.resources.cookedMeat -= cost;
				this.state.workers[workerType] =
					(this.state.workers[workerType] || 0) + 1;

				const efficiencyLevel = this.state.upgrades.efficiency || 0;
				this.workerManager.startWorkerTask(workerType, efficiencyLevel);

				this.uiManager.updateUI();
			} else {
				this.uiManager.showNotification(
					`Not enough food to hire a ${workerType}!`,
					'error'
				);
			}
		}

		// ------------------------------
		// UI Management
		// ------------------------------

		// Update the visibility and text of buttons based on the game state
		updateButtons() {
			this.uiManager.elements.huntButton.classList.toggle(
				'hidden',
				!this.state.upgrades.hunting_unlocked
			);
			this.uiManager.elements.cookButton.classList.toggle(
				'hidden',
				!this.state.upgrades.cooking_unlocked
			);
			Object.entries(this.uiManager.elements.hireButtons).forEach(
				([type, button]) => {
					button.textContent = `Hire ${
					type.charAt(0).toUpperCase() + type.slice(1)
				} (${this.formatCost(this.workerManager.getWorkerCost(type))})`;
				}
			);
			this.uiManager.renderUpgrades();
			this.uiManager.renderItems();
		}

		// Perform an action with a delay and update the UI
		performAction(button, action, delay) {
			const wrapper = button.closest('.action-wrapper');
			const progress = wrapper ? wrapper.querySelector('.action-progress') : null;
			button.disabled = true;
			if (progress) {
				progress.style.width = '0%';
				progress.style.transition = `width ${delay}ms linear`;
				progress.offsetHeight;
				progress.style.width = '100%';
			}
			setTimeout(() => {
				action();

				if (button.id === 'forage-button') {
					this.workerManager.triggerWorkerAction(
						'woodcutter',
						'sticks',
						config.yields.huntYield,
						'workerBonusStick'
					);
				} else if (button.id === 'hunt-button') {
					this.workerManager.triggerWorkerAction(
						'hunter',
						'meat',
						config.yields.huntYield,
						'workerBonusMeat'
					);
				} else if (button.id === 'cook-button') {
					this.workerManager.triggerWorkerAction(
						'cook',
						'cookedMeat',
						config.yields.huntYield,
						'workerBonusCook'
					);
				}

				button.disabled = false;
				if (progress) progress.style.width = '0%';
			}, delay);
		}

		// ------------------------------
		// Game Loop
		// ------------------------------

		// Start the game loop
		startGameLoop() {
			Object.keys(config.workerTimers).forEach((workerType) => {
				const efficiencyLevel = this.state.upgrades.efficiency || 0;
				this.workerManager.startWorkerTask(workerType, efficiencyLevel);
			});
			setInterval(() => {
				this.uiManager.updateUI();
			}, 1000);
		}
	}

	// Expose a global instance for inline onclick handlers
	window.game = new GameManager();

	class CutsceneManager {
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

	document.addEventListener('DOMContentLoaded', () => {
		new CutsceneManager();
	});

})();
