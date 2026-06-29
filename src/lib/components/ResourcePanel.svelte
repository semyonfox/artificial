<script>
  import { gameStore } from '../stores/gameStore.js';
  import {
    formatNumber,
    formatResourceName,
    getRelevantResources,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  function getSoftCapMultiplier(key) {
    const gm = $gameStore.gameManager;
    return gm?.systems?.workerManager?.getSoftCapMultiplier?.(key) ?? 1;
  }

  let relevantResources = $derived(getRelevantResources($gameStore.currentEra));

  let visibleResources = $derived(
    Object.entries($gameStore.resources)
      .filter(([key, value]) => {
        if (value <= 0) return false;
        if (key === 'fire') return false;
        // show active-era resources plus global population
        return relevantResources.has(key);
      })
      .map(([key, value]) => {
        const capMult = getSoftCapMultiplier(key);
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
          <div class="flex items-center gap-3">
            <span class="w-7 h-7 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-md text-sm">
              {res.icon}
            </span>
            <span class="text-sm font-medium text-ink-soft">{res.name}</span>
            {#if res.capped}
              <span class="text-[0.65rem] px-1.5 py-0.5 bg-warning/20 text-warning rounded" title="Production at {res.capPercent}%">
                capped
              </span>
            {/if}
          </div>
          <div class="text-right">
            <span class="text-paper font-bold tabular-nums">{formatNumber(res.value)}</span>
            {#if res.lifetime}
              <span class="text-xs text-ink-muted ml-1 tabular-nums" title="Lifetime: {res.lifetime}">
                ({formatNumber(res.lifetime)})
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
