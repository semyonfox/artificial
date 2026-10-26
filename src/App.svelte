<script>
  import { onMount } from 'svelte';
  import { gameStore } from './lib/stores/gameStore.js';
  import { GameManager } from '../js/GameManager.js';
  import { downloadText } from './lib/utils/download.js';
  import { telemetry } from './lib/utils/telemetry.js';
  import PrivacySettings from './lib/components/PrivacySettings.svelte';

  import TopBar from './lib/components/TopBar.svelte';
  import Modal from './lib/components/Modal.svelte';
  import Objective from './lib/components/Objective.svelte';
  import SaveSettings from './lib/components/SaveSettings.svelte';
  import ResourcePanel from './lib/components/ResourcePanel.svelte';
  import ActionButtons from './lib/components/ActionButtons.svelte';
  import UpgradeGrid from './lib/components/UpgradeGrid.svelte';
  import WorkerPanel from './lib/components/WorkerPanel.svelte';
  import AchievementGrid from './lib/components/AchievementGrid.svelte';
  import PrestigePanel from './lib/components/PrestigePanel.svelte';
  import LogPanel from './lib/components/LogPanel.svelte';
  import NotificationToast from './lib/components/NotificationToast.svelte';
  import CivSpecializationPanel from './lib/components/CivSpecializationPanel.svelte';
  import TradeRoutePanel from './lib/components/TradeRoutePanel.svelte';
  import WonderPanel from './lib/components/WonderPanel.svelte';

  let loading = $state(true);
  let startupFailed = $state(false);
  let startupIssue = $state('');
  let recoveryError = $state('');
  let manager;
  // which menu dialog is open, if any
  let menu = $state(null);
  const menuTitles = {
    civilization: 'Civilization',
    prestige: 'Prestige',
    achievements: 'Achievements',
    log: 'Log',
    settings: 'Settings',
  };

  function downloadRejectedSave() {
    if (typeof manager?.rejectedSave === 'string') downloadText(manager.rejectedSave, 'artificial-recovery.json');
  }

  function startFresh() {
    if (!manager?.persistence.confirm('Discard the rejected local save and start fresh? Download a recovery copy first. This cannot be undone.')) return;
    try {
      manager.persistence.removeSave();
      manager.persistence.removeLastActive();
      retryStartup();
    } catch {
      recoveryError = 'Browser storage is unavailable. The rejected save has not been replaced.';
    }
  }

  function retryStartup() {
    window.location.reload();
  }

  onMount(() => {
    const gm = new GameManager();
    manager = gm;
    let destroyed = false;

    gm.initPromise
      .then(() => {
        if (destroyed) {
          gm.destroy();
          return;
        }

        gameStore.initialize(gm);
        void telemetry.send("count", "app_open", "game");
        loading = false;
      })
      .catch((error) => {
        if (destroyed) return;

        console.error('Game startup failed:', error);
        gm.destroy();
        void telemetry.send("error", gm.startupIssue === "save" ? "validation_failed" : gm.startupIssue === "storage" ? "storage_failed" : "unexpected_error", "game");
        startupIssue = gm.startupIssue || "unknown";
        startupFailed = true;
        loading = false;
      });

    if (import.meta.env.DEV) {
      window.game = gm;
    }

    return () => {
      destroyed = true;
      if (window.game === gm) {
        delete window.game;
      }
      gameStore.dispose(gm);
      gm.destroy();
    };
  });
</script>

{#if loading || startupFailed}
  <div class="flex items-center justify-center min-h-screen p-4">
    <div class="flex flex-col items-center gap-4">
      {#if startupFailed}
        <main class="card max-w-md p-6 text-center" role="alert" aria-labelledby="startup-error-title">
          <h1 id="startup-error-title" class="text-xl font-bold text-paper">{startupIssue === "save" ? "Your save needs recovery" : "Game could not start"}</h1>
          <p class="mt-2 text-ink-muted">{startupIssue === 'save' ? 'This save is unreadable or from a newer game version. It has been preserved; no fresh game or autosave has started.' : startupIssue === 'storage' ? 'Browser storage is unavailable. Allow local storage for this game, then try again.' : 'Reload the game to try again.'}</p>
          {#if startupIssue === 'save'}
            <div class="mt-4 flex flex-col gap-2">
              <button class="btn btn-secondary" onclick={downloadRejectedSave}>Download recovery copy</button>
              <button class="btn btn-danger" onclick={startFresh}>Discard save and start fresh</button>
            </div>
          {/if}
          <p role="status" class="mt-2 text-warning">{recoveryError}</p>
          <button type="button" class="btn btn-primary mt-5" onclick={retryStartup}>Try again</button>
        </main>
      {:else}
        <div class="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" aria-hidden="true"></div>
        <p class="text-ink-muted text-lg" role="status">Loading game...</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="max-w-[1400px] mx-auto p-3 sm:p-4">
    <TopBar onOpen={(id) => (menu = id)} />
    <NotificationToast />

    <main class="game-layout">
      <aside class="panel space-y-5 order-2 lg:order-none" aria-label="Goal and stockpile">
        <Objective />
        <ResourcePanel />
      </aside>

      <section class="panel center-stage order-1 lg:order-none" aria-labelledby="era-title">
        <h2 id="era-title" class="text-2xl font-bold text-paper text-center">{$gameStore.currentEraData?.name}</h2>
        <p class="text-sm text-ink-muted text-center mt-1 mb-6 max-w-md mx-auto">{$gameStore.currentEraData?.description}</p>
        <ActionButtons />
      </section>

      <aside class="panel space-y-5 order-3 lg:order-none" aria-label="Store">
        <UpgradeGrid />
        <WorkerPanel />
      </aside>
    </main>
  </div>

  {#each Object.entries(menuTitles) as [id, title] (id)}
    <Modal {title} bind:open={() => menu === id, (value) => (menu = value ? id : null)}>
      {#if id === 'civilization'}
        <div class="space-y-6">
          <CivSpecializationPanel />
          <TradeRoutePanel />
          <WonderPanel />
        </div>
      {:else if id === 'prestige'}
        <PrestigePanel />
      {:else if id === 'achievements'}
        <AchievementGrid />
      {:else if id === 'log'}
        <LogPanel />
      {:else}
        <SaveSettings />
        <PrivacySettings />
      {/if}
    </Modal>
  {/each}
{/if}
