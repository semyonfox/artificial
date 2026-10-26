<script>
  import { tick } from "svelte";
  import { downloadText } from "../utils/download.js";
  import { gameStore } from '../stores/gameStore.js';

  let exportText = $state('');
  let importText = $state('');
  let showImport = $state(false);
  let saveMessage = $state('');

  async function focusSaveTools() { await tick(); document.getElementById('save-tools')?.focus(); }
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

<section>
  <h3 id="save-tools" tabindex="-1" class="section-label mb-2">Save</h3>
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
