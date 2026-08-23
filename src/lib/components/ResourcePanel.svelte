<script>
  import { gameStore } from '../stores/gameStore.js';
  import {
    formatNumber,
    formatResourceName,
    getRelevantResources,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  let relevantResources = $derived(getRelevantResources($gameStore.currentEra));

  // estimated worker-driven flows; production is zero while inputs are out
  function formatRate(value) {
    const magnitude = Math.abs(value);
    if (magnitude < 0.05) return '±0.0/s';
    return `${value > 0 ? '+' : '−'}${magnitude.toFixed(1)}/s`;
  }

  let visibleResources = $derived(
    Object.entries($gameStore.resources)
      .filter(([key, value]) => {
        if (value <= 0) return false;
        if (key === 'fire') return false;
        // only show resources relevant to current or past eras
        return relevantResources.has(key);
      })
      .map(([key, value]) => {
        const capMult = $gameStore.resourceSoftCapMultipliers[key] ?? 1;
        const lifetime = $gameStore.lifetimeProduced?.[key] || 0;
        const flow = $gameStore.resourceFlows?.[key];
        const net = flow ? flow.producePerSec - flow.consumePerSec : null;
        return {
          key,
          value: Math.floor(value),
          icon: getResourceIcon(key, '?'),
          name: formatResourceName(key),
          capped: capMult < 1,
          capPercent: Math.round(capMult * 100),
          lifetime: lifetime > value ? Math.floor(lifetime) : null,
          flow,
          net,
          hasFlow: Boolean(flow && flow.producePerSec + flow.consumePerSec >= 0.05),
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
            <span class="text-sm font-medium text-ink-soft truncate">{res.name}</span>
            {#if res.capped}
              <span class="text-[0.7rem] px-1.5 py-0.5 bg-warning/20 text-warning rounded" title="Production at {res.capPercent}%">
                capped
              </span>
            {/if}
          </div>
          <div class="flex flex-col items-end leading-tight shrink-0">
            <span class="text-paper font-bold tabular-nums">{formatNumber(res.value)}</span>
            <span
              class="text-[0.7rem] tabular-nums {res.hasFlow
                ? (res.net > 0.05 ? 'text-success' : res.net < -0.05 ? 'text-danger' : 'text-ink-muted')
                : 'invisible'}"
              title="Estimated worker rates — production may differ with bonuses"
            >
              {#if res.hasFlow}
                {formatRate(res.net)}
              {/if}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
