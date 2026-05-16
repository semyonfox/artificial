<script>
  import { gameStore } from '../stores/gameStore.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());

  let progressPercent = $derived.by(() => {
    if (!eraData?.advancementCost) return 100;
    const entries = Object.entries(eraData.advancementCost);
    const fulfillments = entries.map(([resource, required]) => {
      const current = $gameStore.resources[resource] || 0;
      return Math.min(1, current / required);
    });
    return (fulfillments.reduce((a, b) => a + b, 0) / fulfillments.length) * 100;
  });

  let canAdvance = $derived($gameStore.gameState?.canAdvanceEra() ?? false);

  function advanceEra() {
    $gameStore.gameManager?.advanceEra();
  }
</script>

<div class="flex items-center gap-4 sm:gap-6">
  <div class="flex flex-col min-w-0">
    <span class="text-[0.6rem] font-bold uppercase tracking-widest text-ink-muted">Era</span>
    <strong class="text-sm font-semibold text-ink truncate">{eraData?.name || 'Paleolithic Era'}</strong>
  </div>

  <div class="flex-1 max-w-[200px]">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progressPercent.toFixed(1)}%"></div>
    </div>
  </div>

  {#if canAdvance}
    <button class="btn btn-primary btn-sm whitespace-nowrap" onclick={advanceEra}>
      Advance Era
    </button>
  {/if}
</div>
