# Evolution Clicker: Core Loop Rebuild

**date:** 2026-05-15
**replaces:** balance redesign from 2026-04-10 (math was rush-dominant, content survives)
**target:** days-to-weeks idle game, 12 eras, prestige rewards depth not speed

---

## the five problems being fixed

1. **rush dominates**: EP formula `sqrt(value/500) + eraIdx*8` makes era reached worth more than resources produced. optimal play = skip everything, prestige fast.
2. **softlocks**: era advancement needs processed resources whose upgrades are not always reachable from previous-era resources alone. wrong buy order → stuck.
3. **maxes out early**: linear `1 + EP*0.1` multiplier plus stacking era-skip perks (75 EP each) → done in ~5 runs.
4. **resources pile up unused**: most resources only consumed at era-advancement. post-advance they sit dead.
5. **no idle depth**: offline progress is weak. workers don't continuously consume their inputs.

---

## section 1 — prestige math

### lifetime production tracking
new state field `data.lifetimeProduced: Record<resource, number>`. monotonically increasing counter. every grant via `addResource` increments it. **consumption never decreases it.** this is the prestige currency source.

### EP formula
```
eraTier(resource) = era index of the era that introduced that resource (0..11)
eraMultiplier(tier) = 3^tier         // 1, 3, 9, 27, ..., 177147
points = Σ lifetimeProduced[r] × eraMultiplier(eraTier(r))
EP = floor(log10(1 + points / SCALE))
```
`SCALE = 1000`. tuned so first clean run to Industrial ≈ 50 EP, Universal ≈ 200 EP.

### multiplier
```
multiplier = 1 + sqrt(lifetimeEP) × 0.3
```
- 10 EP → 1.95×
- 100 EP → 4.0×
- 1000 EP → 10.5×
- 10000 EP → 31×

sqrt growth means always meaningful, never runaway. no cap.

### why rush dies
- rushing to Universal with thin production: ~`log10(low_value × 177k) ≈ 8 EP`
- building at Bronze + Iron with millions of accumulated resources: 50-80 EP
- depth beats speed by an order of magnitude.

---

## section 2 — anti-softlock

### invariant
**every upgrade in era N must be purchasable using only resources reachable from era N or earlier baseline actions.**

baseline actions = the era's three click-actions, available without any upgrade. e.g. Paleolithic baseline = forage (sticks + chance stones).

### implementation
- at game start, run `validateProgression()` from a new `ProgressionValidator` module. for each era E:
  - compute "reachable resources" = baseline action outputs + outputs from upgrades whose costs are themselves reachable (BFS)
  - if `eraAdvancementCost(E+1)` references any resource not in reachable set → throw at boot. dev never ships a softlock.
- additionally: every era's first upgrade has cost only in raw click-produced resources of that era. no "you must already have processed X to unlock the upgrade that produces X."

### era advancement costs (revised, all reachable)
keep current population thresholds. rewrite resource requirements so they are ONLY in resources the era's click actions + buyable workers can produce.

(specifics to be set during implementation by reading each era's actions/workers and ensuring requirements are subsets of producible resources.)

---

## section 3 — resource consumption loop

### workers consume inputs continuously
workers gain a `consumes: { resource: amount }` field on their definition. each work tick:
- if all required inputs available: produce normally, deduct inputs
- if any input missing: produce at 20% rate, no consumption (graceful starve)
- displayed status: "fed" / "starving" per worker type

examples:
- cook (paleolithic): consumes meat:1 + sticks:1 per cycle, produces cookedMeat:1
- smelter (iron age): consumes iron_ore:2 + coal:1, produces steel:1
- chip_fabricator (info age): consumes silicon:3 + electricity:1, produces chips:1

this means raw resources have constant demand → no more "pile up unused".

### click actions also consume (where appropriate)
- cook click: needs meat + sticks (already does)
- smelt click: needs ore + coal
- code click: needs computer + electricity

makes mid-era resources part of an active chain, not just a one-time advancement payment.

---

## section 4 — soft caps & breadth

### per-resource cap
```
softCap(resource) = baseCap(resource.era) × (1 + populationFactor + workerFactor)
populationFactor = log10(1 + population) × 0.5
workerFactor = totalWorkersInEra × 0.05
```
at-or-above cap: production yield reduces to 25% until you grow the supporting infrastructure (population, more workers in that era).

### breadth incentive
hitting cap on one resource doesn't block progression but slows it. to advance era you need multiple resources at meaningful levels — so capping one and ignoring others doesn't work. forces you to develop the chain.

### no hard ceilings
caps are soft only. patient players still produce. impatient players grow population/workers to lift the cap. either works.

---

## section 5 — offline progress

current `OfflineManager`: weak, capped low.

### new rules
- workers continue production while offline at **full rate up to 8 hours**
- 8-24 hours: 50% rate
- past 24 hours: capped at 24h-worth (so leaving a week away isn't a problem but also isn't game-breaking)
- click actions do NOT run offline (player must click)
- population growth runs offline at full rate up to the era's cap

returns a summary on resume: "you were away X hours, workers produced: ...".

---

## section 6 — talent tree rebuild

### removed
- all `eraSkip*` perks. these are the load-bearing cause of the rush meta.
- `universalDestiny` (depended on era skip mechanic).

### kept (tier 1-3, era-unlocked, EP-priced)
- quickStart (5 EP) — 10 of each Paleolithic resource at run start
- firstWorkers (10 EP) — 2 gatherers + 1 cook at run start
- ancestralMemory (10 EP) — start at 25% of highest-era population cap
- populationBoom (20 EP) — +200% population growth rate
- fertileLands (20 EP) — grain ×2 from Neolithic on
- workerEfficiency (25 EP) — all worker intervals -15%
- masterCrafter (30 EP, bronze+) — worker hire costs -25%
- engineeringGenius (35 EP, bronze+) — upgrade costs -20%
- culturalMemory (40 EP, renaissance+) — auto-unlock tier-1 upgrade of each completed era
- timeDilation (50 EP, renaissance+) — worker intervals -30% (stacks)

### added — "era mastery" perks
one per era, costs scale with era. unlock when you have **completed** that era at least once in a previous run. each gives a permanent **production** bonus to that era's signature resources on all future runs.

- paleolithicMastery (15 EP) — sticks/stones/meat production ×1.5
- neolithicMastery (25 EP) — grain/pottery/textiles ×1.5
- ... through universalMastery (300 EP) — reality engines/multiverse ×1.5

these stack with the global EP multiplier. they reward **completing** eras, not skipping them.

### added — "deep production" perks (long-tail idle)
endgame-priced perks for players with 1000+ lifetime EP:
- compoundGrowth (500 EP) — multiplier formula becomes `1 + sqrt(EP) × 0.4` (steeper)
- offlineMaster (750 EP) — offline production rates +50%, cap extended to 16h full / 48h reduced
- chainBonus (1000 EP) — workers that consume inputs produced by other workers gain ×1.5 yield (rewards chain-building)

---

## section 7 — pacing

### first run target
- Paleolithic → Neolithic: ~30 min active play (currently ~4 min — too short)
- Neolithic → Bronze: ~45 min
- Bronze → Iron: ~1 hour
- ... scaling up
- first run to Universal: 15-25 hours total play time, spread across days with offline contribution

### prestige run target
- run 2 (after 50 EP): noticeably faster (2× multiplier on everything)
- run 5: era 8 in ~3 hours
- run 10: Universal in ~6 hours active
- run 20+: optimization & endgame perk hunt

### never-finished feeling
deep production perks at 500+ EP keep meaningful goals. the sqrt curve means a player at 10k EP still earns more from playing.

---

## section 8 — what changes in code

### state additions
- `data.lifetimeProduced: Record<string, number>` — monotonic counter per resource
- `data.prestige.completedEras: string[]` — for era mastery unlocks
- `data.prestige.lifetimeEPMilestones` — for deep production perk gating

### file changes
- `js/core/GameState.js`: add lifetime tracking, migration for old saves
- `js/core/config.js`: era tier values, soft cap bases, new talent tree entries, remove era skips
- `js/systems/PrestigeManager.js`: new EP formula, new multiplier, new perks, drop era skip logic
- `js/systems/ResourceManager.js`: increment lifetime on every grant, expose lifetime values
- `js/systems/WorkerManager.js`: continuous input consumption, starve = 20%, era mastery multipliers
- `js/systems/OfflineManager.js`: tiered offline rates (8h full / 24h half / cap)
- `js/systems/UIManager.js`: show lifetime per resource, show soft cap, new talent tree UI, remove era skip UI
- `js/GameManager.js`: wire validator at boot, apply era mastery multipliers
- new: `js/systems/ProgressionValidator.js` — boot-time softlock check

### compatibility
- bump save schema version, run migration that sets lifetime = current resource amount (best-effort) and clears purchased era-skip perks (refunds their EP).
- old saves don't break; they get rebalanced into the new system.

---

## success criteria

1. ✓ rushing to a high era with thin production yields <10% the EP of a deep run two eras lower
2. ✓ no possible buy order causes softlock (validator passes)
3. ✓ every resource is consumed somewhere on a recurring basis
4. ✓ multiplier grows meaningfully but never trivializes (sqrt curve)
5. ✓ first run takes 15+ hours; can be spread across 2-3 days using offline progression
6. ✓ talent tree has no era skip perks
7. ✓ game still loads existing saves (migration works)
8. ✓ era-mastery perks reward completion, not skipping

---

## explicitly out of scope (this round)

- new eras
- new resource types
- visual/UI redesign beyond what's needed for new mechanics
- random events overhaul
- multiplayer / leaderboard
- mobile / touch controls

future work documents these.
