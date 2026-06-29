<script>
  import { gameStore } from '../stores/gameStore.js';
  import { getEraProgressPercent } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());

  let progressPercent = $derived.by(() => {
    return getEraProgressPercent(eraData?.advancementCost, $gameStore.resources);
  });

  let canAdvance = $derived($gameStore.gameState?.canAdvanceEra() ?? false);

  function advanceEra() {
    $gameStore.gameManager?.advanceEra();
    gameStore.refresh();
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
