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
      ...Object.keys($gameStore.resources),
      ...$gameStore.advancementRequirements.map(req => req.resource),
      ...$gameStore.actions.flatMap(action => Object.keys(action.consumes || {})),
      ...$gameStore.workerViews.filter(worker => worker.count > 0).flatMap(worker => Object.keys(worker.consumes || {})),
    ])].map(key => [key, $gameStore.resources[key] || 0])
      .filter(([key, value]) => {
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
        const lifetime = $gameStore.lifetimeProduced?.[key] || 0;
        return {
          key,
          value: Math.floor(value),
          icon: getResourceIcon(key, '?'),
          name: formatResourceName(key),
          capped: capMult < 1,
          capPercent: Math.round(capMult * 100),
          lifetime: lifetime > value ? Math.floor(lifetime) : null,
        };
      })
  );
</script>

<div>
  <h3 class="section-label mb-3">Resource Overview</h3>

  {#if visibleResources.length === 0}
    <p class="text-sm text-ink-muted">No resources yet. Start gathering!</p>
  {:else}
    <div class="space-y-1">
      {#each visibleResources as res (res.key)}
        <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-2/50 hover:bg-surface-3 transition-colors group">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-7 h-7 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-md text-sm shrink-0">
              {res.icon}
            </span>
            <span class="text-sm font-medium text-ink-soft min-w-0 break-words">{res.name}</span>
            {#if res.capped}
              <span class="text-xs px-1.5 py-0.5 bg-warning/20 text-warning rounded" >
                production {res.capPercent}%
              </span>
            {/if}
          </div>
          <div class="flex flex-col items-end leading-tight shrink-0">
            <span class="text-paper font-bold tabular-nums">{formatNumber(res.value)}</span>

          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
