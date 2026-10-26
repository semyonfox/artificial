<script>
  import { gameStore } from '../stores/gameStore.js';
  import { config } from '../../../js/core/config.js';
  import { formatNumber, formatResourceName, getResourceIcon } from '../utils/gameFormatting.js';

  let canAdvance = $derived($gameStore.canAdvance);
  let nextEra = $derived($gameStore.nextEra);
  let requirements = $derived($gameStore.advancementRequirements);

  // one hint at a time: the tutorial early on, then whatever is holding
  // population back
  let hint = $derived.by(() => {
    const upgrades = $gameStore.upgrades;
    if ($gameStore.currentEra === 'paleolithic') {
      if (!upgrades.stoneKnapping) return 'Forage for sticks and stones, then buy Stone Knapping to unlock hunting.';
      if (!upgrades.fireControl) return 'Hunt for meat and fur, then buy Fire Control to unlock cooking.';
    }
    const popReq = requirements.find((req) => req.resource === 'population');
    if (!popReq || popReq.complete) return null;
    const growth = config.balance?.populationGrowth || {};
    const { pop, cap, loadRatio, supportAvailable, supportResources } = $gameStore.populationView;
    if (pop >= cap) return 'Population is at this era’s cap.';
    if (loadRatio > (growth.workerLoadSoftCap || 0.65)) return 'Most people are working, so growth is slow. Hold off hiring.';
    if (supportAvailable < Math.max(1, pop * (growth.foodBufferPerCapita || 0.6))) {
      return `Growth is slow. Stock up on ${supportResources.map(formatResourceName).join(' or ')}.`;
    }
    return null;
  });

  function advance() {
    if (gameStore.advanceEra()) document.getElementById('objective-title')?.focus();
  }
</script>

<section aria-labelledby="objective-title">
  <h2 id="objective-title" tabindex="-1" class="section-label mb-2">
    {nextEra ? `Next: ${nextEra.name}` : 'Final era reached'}
  </h2>

  {#if requirements.length > 0}
    <ul class="space-y-2">
      {#each requirements as req (req.resource)}
        {@const pct = Math.min(100, (req.current / req.required) * 100)}
        <li>
          <div class="flex items-center justify-between text-xs">
            <span class="flex items-center gap-1.5 {req.complete ? 'text-success' : 'text-ink-soft'}">
              <span aria-hidden="true">{getResourceIcon(req.resource, '')}</span>{formatResourceName(req.resource)}
            </span>
            <span class="tabular-nums {req.complete ? 'text-success' : 'text-ink-muted'}">
              {req.complete ? '✓' : `${formatNumber(req.current)} / ${formatNumber(req.required)}`}
            </span>
          </div>
          <div class="mini-bar mt-1" aria-hidden="true">
            <div class="mini-fill {req.complete ? 'bg-success' : 'bg-accent'}" style="width: {pct.toFixed(1)}%"></div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  {#if hint}
    <p class="mt-3 text-xs leading-relaxed text-warning">{hint}</p>
  {/if}

  {#if nextEra}
    <button class="btn w-full mt-3 {canAdvance ? 'btn-primary advance-ready' : 'btn-secondary'}" disabled={!canAdvance} onclick={advance}>
      {canAdvance ? `Advance to ${nextEra.name}` : 'Keep gathering'}
    </button>
  {/if}
</section>
