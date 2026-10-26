<script>
  import { gameStore } from '../stores/gameStore.js';
  import {
    formatNumber,
    formatResourceName,
    getRelevantResources,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  function resourceIn(cost, key) { return Object.hasOwn(cost || {}, key); }

  let relevantResources = $derived(getRelevantResources($gameStore.currentEra));

  let visibleResources = $derived(
    [...new Set([
      ...Object.keys($gameStore.resources).filter(key => key !== 'population'),
      ...$gameStore.advancementRequirements.map(req => req.resource),
      ...$gameStore.actions.flatMap(action => Object.keys(action.consumes || {})),
      ...$gameStore.workerViews.filter(worker => worker.count > 0).flatMap(worker => Object.keys(worker.consumes || {})),
    ])].map(key => [key, $gameStore.resources[key] || 0])
      .filter(([key, value]) => {
        if (key === 'population') return false;
        if (value <= 0) {
          const needed = $gameStore.workerViews.some(worker => worker.count > 0 && (resourceIn(worker.consumes, key) || resourceIn(worker.cost, key)))
            || $gameStore.advancementRequirements.some(req => req.resource === key)
            || $gameStore.actions.some(action => resourceIn(action.consumes, key));
          if (!needed) return false;
        }
        if (key === 'fire') return false;
        // only show resources relevant to current or past eras
        return relevantResources.has(key);
      })
      .map(([key, value]) => {
        const capMult = $gameStore.resourceSoftCapMultipliers[key] ?? 1;
        return {
          key,
          value: Math.floor(value),
          icon: getResourceIcon(key, '?'),
          name: formatResourceName(key),
          capped: capMult < 1,
          capPercent: Math.round(capMult * 100),
        };
      })
  );

  let population = $derived($gameStore.populationView);
</script>

<section aria-labelledby="stock-title">
  <h2 id="stock-title" class="section-label mb-2">Stockpile</h2>
  <div class="flex items-center justify-between gap-2 px-2 py-2 mb-2 rounded-lg bg-surface-2">
    <span class="flex items-center gap-2 text-sm text-ink-soft"><span aria-hidden="true">👥</span>Population</span>
    <span class="text-right leading-tight">
      <span class="block font-bold text-paper tabular-nums">{formatNumber(population.pop)}<span class="text-ink-muted font-normal"> / {formatNumber(population.cap)}</span></span>
      <span class="block text-xs text-ink-muted tabular-nums">{$gameStore.availablePopulation} free</span>
    </span>
  </div>

  {#if visibleResources.length === 0}
    <p class="text-sm text-ink-muted px-2">Nothing gathered yet.</p>
  {:else}
    <ul class="divide-y divide-ink/5">
      {#each visibleResources as res (res.key)}
        <li class="flex items-center justify-between gap-2 px-2 py-1.5">
          <span class="flex items-center gap-2 min-w-0 text-sm text-ink-soft">
            <span aria-hidden="true" class="w-5 text-center">{res.icon}</span>
            <span class="truncate">{res.name}</span>
            {#if res.capped}
              <span class="text-[0.65rem] px-1 rounded bg-warning/20 text-warning" title="Above the soft cap, production is reduced">cap</span>
            {/if}
          </span>
          <span class="font-semibold text-paper tabular-nums">{formatNumber(res.value)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
