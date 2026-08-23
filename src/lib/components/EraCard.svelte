<script>
  import { gameStore } from '../stores/gameStore.js';
  import {
    formatNumber,
    formatResourceName,
    getEraProgressPercent,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.currentEraData);
  let canAdvance = $derived($gameStore.canAdvance);

  let progressPercent = $derived.by(() => {
    return getEraProgressPercent(eraData?.advancementCost, $gameStore.resources);
  });

  let requirements = $derived($gameStore.advancementRequirements);

  function advanceEra() {
    gameStore.advanceEra();
  }

  function saveGame() {
    gameStore.saveGame();
  }

  function exportSave() {
    gameStore.exportSave();
  }

  function importSave() {
    const encoded = prompt('Paste your exported save data:');
    if (encoded) gameStore.importSave(encoded);
  }

  function resetGame() {
    gameStore.resetGame();
  }

  function restoreImportBackup() {
    gameStore.restoreImportBackup();
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
    <div
      class="progress-bar mb-2"
      role="progressbar"
      aria-label="Current era advancement progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(progressPercent)}
    >
      <div class="progress-fill" style="width: {progressPercent.toFixed(1)}%"></div>
    </div>
    {#if requirements.length > 0}
      <div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
        {#each requirements as req (req.resource)}
          <div class="flex items-center justify-between gap-1.5 min-w-0">
            <span class="flex items-center gap-1 min-w-0 text-xs {req.complete ? 'text-success' : 'text-ink-muted'}">
              <span class="shrink-0">{getResourceIcon(req.resource, '')}</span>
              <span class="truncate">{formatResourceName(req.resource)}</span>
            </span>
            <span
              class="text-xs tabular-nums shrink-0"
              class:text-success={req.complete}
              class:text-paper={!req.complete}
            >
              {formatNumber(req.current)}/{formatNumber(req.required)}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-ink-muted text-center">Final era reached</p>
    {/if}
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
  {#if $gameStore.hasImportBackup}
    <button class="btn btn-secondary btn-sm w-full mt-2" onclick={restoreImportBackup}>
      Restore pre-import save
    </button>
  {/if}
</section>
