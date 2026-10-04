<script>
  import { tick } from "svelte";
  import { downloadText } from "../utils/download.js";
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

  let exportText = $state('');
  let importText = $state('');
  let showImport = $state(false);
  let saveMessage = $state('');

  async function focusSaveTools() { await tick(); document.getElementById('save-tools')?.focus(); }
  function advanceEra() { if (gameStore.advanceEra()) document.getElementById('objective-title')?.focus(); }
  function saveGame() { saveMessage = gameStore.saveGame() ? 'Saved in this browser.' : 'Save failed. Export this run to keep a copy.'; }
  async function exportSave() {
    exportText = await gameStore.exportSave() || '';
    await tick();
    document.getElementById('export-text')?.focus();
  }
  function importSave() {
    if (gameStore.importSave(importText)) {
      importText = '';
      showImport = false;
      saveMessage = 'Imported. Restore pre-import save is available below.';
      focusSaveTools();
    } else saveMessage = $gameStore.importFeedback || 'Import cancelled. Your run is unchanged.';
  }
  function resetGame() { if (gameStore.resetGame()) { exportText = ''; saveMessage = 'All progress reset.'; focusSaveTools(); } }
  function restoreImportBackup() { if (gameStore.restoreImportBackup()) { saveMessage = 'Pre-import save restored.'; focusSaveTools(); } }

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
      <div class="grid grid-cols-1 gap-x-2 gap-y-1 mt-2">
        {#each requirements as req (req.resource)}
          <div class="flex items-center justify-between gap-1.5 min-w-0">
            <span class="flex items-center gap-1 min-w-0 text-xs {req.complete ? 'text-success' : 'text-ink-muted'}">
              <span class="shrink-0">{getResourceIcon(req.resource, '')}</span>
              <span class="break-words">{formatResourceName(req.resource)}</span>
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

  <h3 id="save-tools" tabindex="-1" class="panel-title mb-2">Save &amp; recovery</h3>
  <p class="text-sm text-ink-muted mb-3">Saves stay in this browser. Export a copy before clearing browser data or resetting.</p>
  <div class="grid grid-cols-2 gap-2">
    <button class="btn btn-ghost btn-sm" onclick={saveGame}>Save</button>
    <button class="btn btn-ghost btn-sm" onclick={exportSave}>Export</button>
    <button class="btn btn-ghost btn-sm" onclick={() => { showImport = !showImport; }}>Import</button>
    <button class="btn btn-danger btn-sm" onclick={resetGame}>Reset</button>
  </div>
  <p class="text-sm text-ink-soft mt-2" role="status">{saveMessage}</p>
  {#if exportText}
    <label class="block text-sm mt-3" for="export-text">Exported save — select and copy</label>
    <textarea id="export-text" readonly value={exportText} class="w-full min-w-0 mt-2 p-2 bg-surface-0 border border-ink/20 rounded-lg" rows="4"></textarea>
    <button class="btn btn-secondary w-full mt-2" onclick={() => downloadText(exportText, 'artificial-save.txt')}>Download exported save</button>
    <button class="btn btn-ghost w-full mt-2" onclick={() => { exportText = ''; focusSaveTools(); }}>Close export</button>
  {/if}
  {#if showImport}
    <form class="mt-3 space-y-2" onsubmit={(event) => { event.preventDefault(); importSave(); }}>
      <label class="block text-sm" for="import-text">Paste an exported save</label>
      <textarea id="import-text" bind:value={importText} class="w-full min-w-0 p-2 bg-surface-0 border border-ink/20 rounded-lg" rows="4" required></textarea>
      <p class="text-sm text-ink-muted">Your current run is backed up before import. Reset or another import replaces that recovery copy.</p>
      <button class="btn btn-primary w-full" type="submit">Validate and import</button>
      <button class="btn btn-ghost w-full" type="button" onclick={() => { showImport = false; importText = ''; focusSaveTools(); }}>Cancel import</button>
    </form>
  {/if}
  {#if $gameStore.hasImportBackup}
    <button class="btn btn-secondary btn-sm w-full mt-2" onclick={restoreImportBackup}>
      Restore pre-import save
    </button>
  {/if}
</section>
