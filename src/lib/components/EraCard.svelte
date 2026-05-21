<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatAdvancementProgress, getEraProgressPercent } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());
  let canAdvance = $derived($gameStore.gameState?.canAdvanceEra() ?? false);

  let progressPercent = $derived.by(() => {
    return getEraProgressPercent(eraData?.advancementCost, $gameStore.resources);
  });

  let progressText = $derived.by(() => {
    return formatAdvancementProgress(eraData?.advancementCost, $gameStore.resources);
  });

  function advanceEra() {
    $gameStore.gameManager?.advanceEra();
  }

  function saveGame() {
    $gameStore.gameManager?.saveGame();
  }

  function exportSave() {
    $gameStore.gameManager?.exportSave();
  }

  function importSave() {
    const encoded = prompt('Paste your exported save data:');
    if (encoded) $gameStore.gameManager?.importSave(encoded);
  }

  function resetGame() {
    $gameStore.gameManager?.resetGame();
  }
</script>

<section class="p-4 bg-surface-2 border border-ink/15 rounded-lg">
  <p class="section-label mb-1">Current Era</p>
  <h3 class="text-lg font-bold text-paper mb-3">
    {eraData?.name || 'Paleolithic Era'}
    {#if eraData?.timespan}
      <span class="text-sm font-normal text-ink-muted ml-1">({eraData.timespan})</span>
    {/if}
  </h3>

  <div class="mb-3">
    <div class="progress-bar mb-2">
      <div class="progress-fill" style="width: {progressPercent.toFixed(1)}%"></div>
    </div>
    <p class="text-xs text-ink-muted text-center tabular-nums">{progressText}</p>
  </div>

  <button
    class="btn w-full mb-3"
    class:btn-primary={canAdvance}
    class:btn-secondary={!canAdvance}
    disabled={!canAdvance}
    onclick={advanceEra}
  >
    {canAdvance ? 'Advance Era' : 'Requirements not met'}
  </button>

  <div class="grid grid-cols-4 gap-2">
    <button class="btn btn-ghost btn-sm" onclick={saveGame}>Save</button>
    <button class="btn btn-ghost btn-sm" onclick={exportSave}>Export</button>
    <button class="btn btn-ghost btn-sm" onclick={importSave}>Import</button>
    <button class="btn btn-danger btn-sm" onclick={resetGame}>Reset</button>
  </div>
</section>
