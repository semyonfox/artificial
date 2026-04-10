# Evolution Clicker: Balance Redesign Spec

**Date:** 2026-04-10  
**Scope:** Complete economic rebalance for authentic resource chains, roguelike prestige progression, and ~2 hour first playthrough  
**Identity:** Human civilization simulator (clicker) where resources are real, chains are authentic, and prestige makes each run feel progressively faster

---

## 1. Core Vision

Evolution Clicker is a 12-era incremental game where players advance human civilization from Paleolithic to Universal. Each era has authentic resource chains (silicon → chips → computers, not abstract "progress"). The game is designed around:

- **~2 hour first playthrough** to reach the final (Universal) era
- **Roguelike prestige loops** - 6-10 runs to soft-complete, then open-ended scaling
- **Authentic resource chains** - every resource has a reason to exist (consumed, gated, or efficiency-boosting)
- **Strategic depth** - era specializations create different viable playstyles each run
- **Active engagement** - worker management + resource optimization, not just passive waiting

---

## 2. Era Economy: Authentic Resource Chains

### Design Principle

Each era has 6-8 core resources that form interconnected chains. Resources serve three roles:

1. **Consumed** - workers or processes consume them (e.g., workers eat food, smelting consumes ore)
2. **Gated** - required to advance era or unlock features
3. **Efficiency** - upgrades that multiply production of other resources

No resource should "pile up" unused. If you're gathering it, something must want it.

### Complete Era Resource Maps

#### Paleolithic (6 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| sticks | forage (click/gatherers) | fuel (cooking, fire), worker hiring, shelter upgrade |
| stones | forage (click/gatherers) | tools (upgrade), worker hiring, shelter upgrade |
| meat | hunt (click/hunters) | cooking (→ cookedMeat) |
| cookedMeat | cook (process, costs meat + sticks fuel) | worker food (1 per 3 cycles), era advancement |
| bones | hunt (byproduct, 30-50% drop) | bone tools (upgrade), worker hiring |
| fur | hunt (byproduct, 60% drop) | clothing (upgrade → +1.5x pop growth), shelter upgrade |

**Chain Logic:**
- Forage sticks/stones → craft bone tools (upgrade) → hunt better → cook meat → feed workers + grow population → unlock Neolithic

**Era Advancement Requirements:**
- 8 population
- 15 sticks, 10 stones (raw gather)
- 8 cookedMeat (processed), 3 fur (byproduct)

---

#### Neolithic (6 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| grain | farm (workers consume grain seed to plant) | food (replaces meat), livestock feed, era advancement |
| clay | gather | pottery production |
| pottery | craft (clay + sticks fuel) | grain storage (unlock grain boost), trade, era advancement |
| livestock | herd (workers, consume grain) | meat, wool/textiles |
| textiles | weave (from wool/hides) | clothing upgrade (→ +1.5x pop growth stacking), trade |
| tools | craft (stones + sticks) | all production rates +15% with tools upgrade |

**Chain Logic:**
- Farm grain → feed livestock → harvest wool → weave textiles. Pottery stores grain surplus. Tools improve everything.

**Era Advancement Requirements:**
- 40 population
- 40 grain, 20 clay (raw gather)
- 15 pottery, 10 textiles, 10 tools (processed)

---

#### Bronze Age (6 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| copper | mine (workers) | bronze smelting |
| tin | mine (workers) | bronze smelting |
| bronze | smelt (copper + tin + fuel) | tools, weapons, trade, era advancement |
| wheel | craft (wood/stone + crafting) | merchant production +50%, trade routes |
| writing | scribe labor (workers) | knowledge production, era advancement |
| trade goods | merchant (processes wheel/bronze) | currency for era advancement |

**Chain Logic:**
- Mine copper + tin → smelt bronze → craft weapons/tools → enable merchants → trade routes generate resources. Writing unlocks knowledge chains.

**Era Advancement Requirements:**
- 150 population
- 30 copper, 20 tin (raw mine)
- 50 bronze, 15 writing, 30 trade goods (processed)

---

#### Iron Age (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| iron ore | mine (workers) | smelting |
| coal | mine (workers) | fuel for all smelting, steam power prep |
| steel | smelt (iron + coal + heat) | tools, weapons, infrastructure, worker hiring |
| coins | mint (bronze/gold + labor) | payment for workers, trade, era advancement |
| roads | construct (stone + labor) | merchant reach +100%, trade value +50% |
| cities | build (stone + steel + population) | population cap boost +100%, resource generation +25% |
| knowledge | research (workers, scribe labor) | era advancement, tech unlocks |

**Chain Logic:**
- Mine iron/coal → smelt steel → build roads/cities → support larger population → generate knowledge → advance. Coins monetize the economy.

**Era Advancement Requirements:**
- 500 population
- 30 iron ore, 20 coal (raw mine)
- 50 steel, 25 coins, 20 roads, 15 knowledge (processed)

---

#### Classical (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| engineering | engineers (workers) | aqueduct building, infrastructure |
| aqueducts | construct (stone + steel + engineering) | city water supply, population efficiency +30%, disease prevention |
| philosophy | philosophers (workers) | knowledge generation, era advancement |
| mathematics | scholar labor (teachers) | knowledge multiplication, engineering precision |
| medicine | physicians (workers) | population health, worker efficiency boost |
| art | artist labor | culture (soft power), trade value +20% |
| citizens | trained population | all labor productivity + science production |

**Chain Logic:**
- Engineers build aqueducts → support city growth. Philosophers/mathematicians boost knowledge. Medicine + art support civilization quality.

**Era Advancement Requirements:**
- 1,500 population
- 50 engineering, 40 stone (raw)
- 30 aqueducts, 40 knowledge (philosophy + math), 20 medicine, 15 art (processed)

---

#### Medieval (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| agriculture | farmers (advanced) | grain production +100%, population food base |
| mills | construct (wood + stone + labor) | grain processing speed +50%, flour production |
| guilds | organize (artisans + coins) | craft quality boost +25%, trade luxury goods |
| manuscripts | monks/scribes (workers) | knowledge preservation, era advancement |
| castles | fortify (stone + steel + labor) | population defense, trade route security +50% |
| religion | priests/monks | population happiness, knowledge alternative source |
| armies | raise (population + steel + coins) | defensive war? (optional mechanic for era specialization) |

**Chain Logic:**
- Farmers produce grain → mills process → feed population → guilds organize crafts → monks write manuscripts → knowledge advances. Castles protect trade.

**Era Advancement Requirements:**
- 5,000 population
- 60 agriculture, 50 stone (raw)
- 40 manuscripts, 30 guilds, 25 castles, 20 religion (processed)

---

#### Renaissance (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| printing | printers (workers) | manuscript production ×10, knowledge spread |
| exploration | explorers (workers) | new trade routes, resources discovery |
| banking | bankers (workers) | coin efficiency +50%, interest generation |
| gunpowder | craftsmen (sulfur + charcoal + labor) | weapons power, military tech unlock |
| optics | craftsmen (glass + labor) | telescope/microscope → science boost |
| navigation | navigators (workers + optics) | exploration efficiency +100%, trade distance reach |
| ships | construct (wood + iron + labor) | trade routes, exploration, age of sail economy |

**Chain Logic:**
- Printers spread knowledge → universities boom → explorers map world → navigation tech enables long trade routes. Banking monetizes everything.

**Era Advancement Requirements:**
- 15,000 population
- 80 printing, 60 wood (raw)
- 50 banking, 40 gunpowder, 30 optics, 25 navigation, 20 ships (processed)

---

#### Industrial (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| coal | mine (massive scale) | steam power, factories, railroads |
| steam | generate (coal + water + heat) | power all machinery |
| factories | construct (steel + coal infrastructure) | mass production of everything |
| railways | build (steel + coal labor) | goods transport speed ×5, resource distribution |
| electricity | generate (coal + steam efficiency) | power advanced machines, lights, communications |
| oil | extract (wells) | late industrial fuel, engine power |
| telegraph | build (copper wire + electricity) | instant communication, coordination bonus |

**Chain Logic:**
- Mine coal → generate steam → power factories → manufacture goods → railways distribute → electricity enables communications. Massive acceleration.

**Era Advancement Requirements:**
- 50,000 population
- 200 coal, 100 wood (raw)
- 150 factories, 80 railways, 60 electricity, 40 telegraph (processed)

---

#### Information (8 resources) - *The authenticity example*

| Resource | Source | What wants it |
|----------|--------|-----------------|
| silicon | refine (sand/minerals + electricity) | chip fabrication |
| chips | fabricate (silicon + electricity labor) | computers, servers, processors |
| computers | assemble (chips + electricity + labor) | research, networking, automation |
| servers | construct (chips + cooling + electricity) | internet backbone, data storage |
| data | generate (by computers + users + internet) | software development, research fuel |
| internet | network (servers + cables + labor) | global connectivity, data generation |
| software | code (programmers labor + data + computers) | automate all production, era advancement |
| satellites | launch (chips + rockets from Space era prep) | GPS, communications, bridge to space |

**Chain Logic:**
- Refine silicon → fab chips → build computers AND servers → servers create internet → users generate data → programmers code software using data → software automates chip fab (feedback loop). Satellites bridge to Space era.

**Era Advancement Requirements:**
- 150,000 population
- 300 silicon, 150 electricity (raw)
- 200 computers, 150 servers, 80 data, 60 internet, 40 software (processed)

---

#### Space Age (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| rockets | construct (steel + computers + labor) | space launch, space stations, moon base |
| solarPanels | manufacture (silicon + computers) | power space infrastructure, efficiency boost |
| robotics | build (computers + labor + resources) | autonomous space operations |
| fusion | research (scientists + knowledge + energy) | unlimited power source unlock |
| spaceStations | construct (steel + computers + rockets) | orbital manufacturing, era advancement |
| terraforming | execute (probes + resources) | prepare Mars/Venus |
| probes | launch (rockets + computers) | remote resource gathering, survey |

**Chain Logic:**
- Build rockets + solar panels → launch space stations → robotics automate → fusion research enables megastructures. Probes enable off-world economy.

**Era Advancement Requirements:**
- 500,000 population
- 400 rockets, 250 solar panels (raw)
- 150 spaceStations, 80 fusion, 50 terraforming (processed)

---

#### Galactic (7 resources)

| Resource | Source | What wants it |
|----------|--------|-----------------|
| antimatter | synthesize (fusion power + labs) | power dyson spheres, create wormholes |
| darkMatter | harvest (via probes + theory) | wormhole navigation, exotic tech |
| wormholes | create (antimatter + dark matter + labs) | FTL travel, resource trading across stars |
| dysonSpheres | construct (megastructures, robots + resources) | harness star power, practically infinite energy |
| quantumComputers | build (exotic materials + scientists) | reality computation, simulation |
| megastructures | build (robots + resources + science) | Dyson spheres, ringworlds, era advancement |
| timeManipulation | research (quantum + theory) | cosmological tech unlock |

**Chain Logic:**
- Synthesize antimatter → create wormholes → enable FTL → harvest dark matter → build Dyson spheres → unlimited energy → construct megastructures → quantumcomputers enable reality engineering.

**Era Advancement Requirements:**
- 2,000,000 population
- 500 antimatter, 300 dark matter (raw/synthesized)
- 20 dysonSpheres, 30 quantumComputers, 15 wormholes, 10 megastructures (processed)

---

#### Universal (6 resources) - *Endgame*

| Resource | Source | What wants it |
|----------|--------|-----------------|
| multiverseAccess | unlock (theory + consciousness) | multiverse civilization bridge |
| realityEngines | build (reality engineers) | universe editing, era advancement |
| consciousnessTransfer | develop (scientists + tech) | digital immortality |
| universalConstants | discover (research) | fundamental law understanding |
| existentialEnergy | tap (reality engineering) | power next stage of existence |
| cosmicStrings | harvest (probes + tech) | build megastructures across realities |

**Chain Logic:**
- Reality engineers harness universal constants → multiverse opens → consciousness transcendence → next stage of existence unlocked. Endgame is asymptotic.

**Era Advancement Requirements:**
- 10,000,000 population (or soft completion, prestige is the real endgame)
- 100 reality engines, 50 multiverse access, 20 consciousness transfers (processed)

---

## 3. Population Growth

### Changes from Current

**Current:** 0.01 pop/sec base - too slow

**New:**
- **Base growth rate:** 0.05 pop/sec (5x current)
- **Era-scaled growth:** `0.05 * (1 + eraIndex * 0.3)` where eraIndex is 0-11
  - Paleolithic: 0.05/sec
  - Neolithic: 0.065/sec
  - Bronze: 0.08/sec
  - ...
  - Universal: 0.215/sec

- **Population caps per era** (refined from current):
  - Paleolithic: 50
  - Neolithic: 150
  - Bronze: 500
  - Iron: 2,000
  - Classical: 8,000
  - Medieval: 25,000
  - Renaissance: 100,000
  - Industrial: 300,000
  - Information: 1,000,000
  - Space: 3,000,000
  - Galactic: 10,000,000
  - Universal: 50,000,000

- **Growth multipliers** (stack):
  - Clothing upgrade: ×1.5
  - Shelter upgrade: ×2.0
  - Aqueducts (Classical+): ×1.3
  - Medicine (Classical+): ×1.2
  - Combined max: ×5.4

- **Prestige perk:** "Ancestral Memory" (10 EP) - population starts at 25% of highest-era-reached cap

---

## 4. Worker Rebalance

### Cost Scaling

**Current:** `baseCost * 1.5^n` - too punishing

**New:** `baseCost * 1.15^n`
- 1st worker: 1.0× base
- 5th worker: 2.01×
- 10th worker: 4.05×
- 20th worker: 16.4×

Still exponential but manageable. Stacking is viable, not impossible.

### Food Consumption

**Current:** 1 food per worker per cycle - crushes early game automation

**New:**
- Base consumption: 1 food per 3 work cycles (not 1 per cycle)
- Worker efficiency scaling:
  - Well-fed (food surplus): 100% efficiency
  - Hungry (food < workers): 60% efficiency + slow warning
  - Starving (no food): 20% efficiency + crisis warning
  - Workers never hard-stop; efficiency degrades gracefully

### Worker Intervals & Speedups

**Current:** Fixed intervals (gatherer 4000ms, hunter 6000ms, etc.) with no upgrade path

**New:**
- Keep base intervals as-is per worker type
- **Era technology upgrade** in each era speeds ALL workers by 25%:
  - Bronze Age: "Bronze Tools" upgrade → all workers -25% interval
  - Iron Age: "Iron Tools" upgrade → -25% additional (total -45%)
  - Industrial: "Steam Power" → -30% additional (total -62.5%)
  - etc.
- Stacking is intentional; late-game workers should feel fast

### Diminishing Returns

**Problem:** Hiring 10 gatherers is always better than 1 of each type

**Fix:** Each successive worker of the same type is 5% less efficient:
- 1st gatherer: 100% output
- 2nd gatherer: 95% output
- 3rd gatherer: 90% output
- 5th gatherer: 81% output

This encourages diversification. 3 gatherers + 3 hunters beats 6 gatherers.

---

## 5. Prestige System Overhaul

### Evolution Points (EP) Formula

**Current:** `floor(sqrt(totalResourceValue / 1000) + eraBonus)` → tiny values

**New:** `floor(sqrt(totalResourceValue / 500) + eraIndex * 8)`
- More generous: sqrt divisor halved, bonus increased
- Reaching Medieval (era 5) with 10,000 resource value: sqrt(10000/500) + 40 = 9 + 40 = **49 EP**
- Reaching Renaissance (era 6) with 100,000 value: sqrt(100000/500) + 48 = 14 + 48 = **62 EP**
- Reaching Information (era 8) with 1,000,000 value: sqrt(1000000/500) + 64 = 45 + 64 = **109 EP**

### Production Multiplier

**Current:** `1 + EP * 0.02` → 50 EP = 1.1× (worthless)

**New:** `1 + EP * 0.1`
- 10 EP: 2.0× (100% bonus)
- 50 EP: 6.0× (500% bonus)
- 100 EP: 11.0× (1000% bonus)

Each prestige genuinely accelerates the next run.

### Prestige Talent Tree

Permanent perks bought with EP. Once purchased, they apply to all future runs:

**Tier 1 (Early game acceleration):**
- *Quick Start* (5 EP): Start with 10 of each Paleolithic resource
- *First Workers* (10 EP): Start with 2 gatherers + 1 cook
- *Ancestral Memory* (10 EP): Start at 25% of highest-era-reached population cap

**Tier 2 (Growth multipliers):**
- *Population Boom* (20 EP): Population growth ×3 in all eras
- *Fertile Lands* (20 EP): Grain production ×2 starting Neolithic
- *Worker Efficiency* (25 EP): All workers -15% intervals

**Tier 3 (Cost reductions):**
- *Master Crafter* (30 EP): All worker hiring costs -25%
- *Engineering Genius* (35 EP): All upgrade costs -20%

**Tier 4 (Advanced unlocks):**
- *Cultural Memory* (40 EP): Auto-unlock first upgrade tier of each completed era
- *Time Dilation* (50 EP): All worker intervals -30% (stacks with era tech)
- *Era Skip: Bronze* (75 EP): Start at Bronze Age (then another 75 EP to skip to Iron, etc.)

**Tier 5 (Soft completion):**
- *Universal Destiny* (200 EP): Unlock Information era as starting point after first Universal reach

Tree grows as highest-era-reached increases. E.g., "Era Skip: Space" only unlocks if you've reached Space Age.

### What Resets on Prestige

- All resources → 0 (except prestige perks)
- All workers → 0 (except prestige perks granting starting workers)
- All upgrades → locked (except auto-unlocked ones from perks)
- Current era → Paleolithic (except perk era skips)

### What Carries Over

- Evolution Points
- Prestige multiplier (production ×)
- Achievements unlocked
- Highest era reached (for perk unlocks)
- Prestige perks (purchased talents)
- Settings (notifications, sound, etc.)

---

## 6. Era Specialization (Replayability)

From **Bronze Age onward**, each era offers **2-3 mutually exclusive upgrades**. You pick one; others are locked for that run. This resets on prestige.

### Examples

**Bronze Age - Economic Paths:**
- *Trade Empire*: Merchants produce ×2, sailing trade routes ×1.5. Metalworkers -25% (production vs. commerce)
- *Weapons Master*: Bronze weapons give ×1.5 all combat resource production. Trade routes -50% (warfare vs. commerce)
- *Scholar's Path*: Writing production ×2, knowledge generation ×1.3. Bronze production -25% (study vs. crafting)

**Renaissance - Philosophical Paths:**
- *Scientific Revolution*: Knowledge generation ×2, all science ×1.5. Printing -25% (discovery vs. spread)
- *Exploration Age*: Explorers ×1.5 output, navigation ×2. Banking -25% (exploration vs. trade)
- *Banking Dynasty*: Coins ×2, trade value ×1.5. Knowledge generation -25% (commerce vs. learning)

**Industrial - Economic Systems:**
- *Mechanization*: Factory output ×2, railways ×1.5. Coal consumption ×1.3 (maximum production)
- *Electrical Revolution*: Electricity generation ×3, all machines ×1.2. Coal -25% yield (technology vs. resources)
- *Robotic Age*: Automation ×2, worker intervals -20%. Human population cap -30% (automation vs. people)

**Information - Tech Specializations:**
- *Internet First*: Internet infrastructure ×2, data generation ×1.5. Computer cost ×1.3 (connectivity)
- *AI/Software*: Software development ×2, automation ×1.5. Silicon refining -25% (software vs. hardware)
- *Quantum Computing*: Quantum research ×3, exotic computation ×2. Standard computers -30% (advanced vs. traditional)

Each creates a different experience and encourages replayability.

---

## 7. Resource Chain Complexity Curve

### Eras 1-3 (Paleolithic → Bronze): Simple 1-Step Chains

**Resources are mostly independent.** Gather → Use or Upgrade.

Example: Forage sticks → use sticks for fire or hiring. Forage stones → use stones for tools or hiring.

**Upgrades unlock production:** Stone Knapping unlocks hunting. Fire Control unlocks cooking.

---

### Eras 4-6 (Iron → Medieval): 2-Step Processing Chains

**Resources feed into a **single processing step** before use.**

Example (Iron Age): Mine iron ore → smelt (with coal) → steel → use in tools/cities/roads/weapons. One clear input→process→output.

**Multiple chains run in parallel** but don't interact. Iron chain, coal chain, coins chain.

---

### Eras 7-9 (Renaissance → Space): 2-3 Step Chains with Light Branching

**Resources have **multiple inputs or outputs**.**

Example (Industrial): Coal → steam → powers factories AND railways AND electricity generators. Each consumer is independent but shares the fuel.

Example (Information): Silicon → chips → computers (research) AND servers (internet). Two different outputs from chips.

**Early feedback loops begin:** More production → faster technology → more automation → earlier prestige.

---

### Eras 10-12 (Galactic → Universal): 3+ Step Chains with Heavy Feedback Loops

**Chains feed back into themselves. Output of one chain accelerates input of another.**

Example (Galactic): Build quantum computers → increases research speed → antimatter synthesis faster → build more dyson spheres → more energy → faster manufacturing → more quantum computers.

**Multiple interdependent chains.** Optimization becomes a puzzle. Which chain to boost first unlocks the others fastest?

---

## 8. Era Pacing & Advancement Gates

### Time Targets (First Playthrough, no prestige perks)

| Era | Cumulative Time | Advancement Req | Notes |
|-----|-----------------|-----------------|-------|
| Paleolithic | 0:00 | — | Start |
| Neolithic | ~4 min | 8 pop, 15 sticks, 10 stones, 8 cookedMeat, 3 fur | First workers unlock |
| Bronze | ~11 min | 150 pop, 30 copper, 20 tin, 50 bronze, 15 writing, 30 trade | Metalworkers unlock |
| Iron | ~21 min | 500 pop, 30 iron ore, 20 coal, 50 steel, 25 coins, 20 roads, 15 knowledge | Cities + monetization |
| Classical | ~32 min | 1,500 pop, 50 engineering, 40 stone, 30 aqueducts, 40 knowledge, 20 medicine, 15 art | Aqueducts unlock |
| Medieval | ~45 min | 5,000 pop, 60 agriculture, 50 stone, 40 manuscripts, 30 guilds, 25 castles, 20 religion | Guilds unlock |
| Renaissance | ~58 min | 15,000 pop, 80 printing, 60 wood, 50 banking, 40 gunpowder, 30 optics, 25 navigation | Exploration unlock |
| Industrial | ~72 min | 50,000 pop, 200 coal, 100 wood, 150 factories, 80 railways, 60 electricity, 40 telegraph | Massive acceleration |
| Information | ~85 min | 150,000 pop, 300 silicon, 150 electricity, 200 computers, 150 servers, 80 data, 60 internet | Digital age |
| Space | ~98 min | 500,000 pop, 400 rockets, 250 solar panels, 150 spaceStations, 80 fusion, 50 terraforming | Orbital economy |
| Galactic | ~108 min | 2,000,000 pop, 500 antimatter, 300 dark matter, 20 dysonSpheres, 30 quantumComputers, 15 wormholes | Megastructures |
| Universal | ~118 min | 10,000,000 pop, 100 reality engines, 50 multiverse access, 20 consciousness transfers | Soft completion |

### Prestige Loop Scaling

**Run 2:** Player buys "Quick Start" (5 EP) + "First Workers" (10 EP) → reaches Medieval by ~35 min, Information by ~70 min

**Run 3:** Buys "Population Boom" (20 EP) → reaches Industrial in ~50 min

**Run 4-5:** Mix perks, soft complete by ~90 min each

**Run 6+:** Player has dozens of perks, blasts through to Information/Space in first 30 minutes, focuses on specialization choices and optimization

---

## 9. Implementation Scope

### Config Changes

- `eraData`: rewrite advancement costs for all 12 eras
- `gameVariables`: update population growth formula
- `workerBonuses`: adjust base intervals, add era tech unlock multipliers
- `efficiencyMultipliers`: add new upgrade multipliers
- New: `prestige.talentTree`: define all buyable perks + costs

### Logic Changes

- **PrestigeManager**: rewrite EP formula, implement talent tree purchase/unlock
- **GameManager**: update population growth formula
- **WorkerManager**: implement diminishing returns (5% per dupe), new consumption rate
- **UpgradeManager**: add era specialization choices (mutually exclusive upgrades)
- **ResourceManager**: add resource chain tracking (for future event/optimization systems)

### UI Changes

- Prestige tab: replace static "1.5× multiplier" with talent tree UI
- Worker hiring: show efficiency % if duplicate type
- Era advancement: show required resources per tier (raw, processed, population)

### Testing

- Verify pacing: first run reaches each era within ±5 min of targets
- Verify prestige acceleration: run 2 is noticeably faster than run 1
- Verify worker economics: can sustain 30 workers without food collapse
- Verify era gates: each gate is achievable with on-era production rates

---

## 10. Prestige Perk Unlock Conditions

Perks unlock based on highest era reached or other conditions:

- **Tier 1-2** (Quick Start, First Workers, Population Boom): Always available
- **Tier 3** (Master Crafter, Engineering Genius): Unlock at Bronze Age
- **Tier 4** (Cultural Memory, Time Dilation): Unlock at Renaissance
- **Era Skip: Bronze**: Unlock when reaching Bronze; costs 75 EP
- **Era Skip: Iron**: Unlock when reaching Iron; costs 75 EP
- ... (one per completed era from Bronze onward)
- **Universal Destiny**: Unlock when reaching Universal; costs 200 EP

---

## 11. Success Criteria

**Game balance is successful when:**

1. ✓ First playthrough reaches Universal era in ~2 hours
2. ✓ Run 2 is noticeably faster than run 1 due to prestige perks
3. ✓ Run 6 feels like a victory lap (early eras ~30 min, late game optimization)
4. ✓ Worker food drain doesn't collapse economy (can sustain 30+ workers)
5. ✓ Each era has 2-3 strategic choices (specialization paths)
6. ✓ Resources feel purposeful - every gathered resource is consumed/used
7. ✓ Late-game resource chains form feedback loops (optimization puzzles)
8. ✓ Prestige multiplier feels meaningful (10 EP = 2×, 50 EP = 6×)
9. ✓ Players want to prestige (perks are desirable)
10. ✓ Replayability: different builds each run (specialization choices)

---

## 12. Future Expansions (Post-MVP)

- Randomized era modifiers (abundant resources, scarcity challenges)
- Civilization traits (locked at start, encourage specialized playstyles)
- Random events with strategic consequences
- Leaderboard/run scoring
- Procedural late-game (Galactic+ becomes infinite chain)
