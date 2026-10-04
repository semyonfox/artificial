<script>
  import { onMount } from 'svelte';
  import { gameStore } from './lib/stores/gameStore.js';
  import { GameManager } from '../js/GameManager.js';
  import { downloadText } from './lib/utils/download.js';
  import { telemetry } from './lib/utils/telemetry.js';
  import PrivacySettings from './lib/components/PrivacySettings.svelte';

  import EraStrip from './lib/components/EraStrip.svelte';
  import EraCard from './lib/components/EraCard.svelte';
  import FlowPanel from './lib/components/FlowPanel.svelte';
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
  let navHeight = $state(0);

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
  <div class="max-w-[1680px] mx-auto p-4" style={`--section-offset: ${navHeight + 16}px`}>
    <a class="btn btn-secondary mb-3" href="#actions">Skip to actions</a>
    <!-- Top Bar -->
    <header class="mb-4 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-1/95 border border-ink/10 rounded-card shadow-xl shadow-black/25">
      <div class="flex flex-wrap items-center gap-3 min-w-0 max-w-full">
        <img src="/logo.png" alt="Artificial" class="w-10 h-10 rounded-lg border border-accent/50" />
        <div class="brand-title">
          <h1 class="text-paper font-bold uppercase tracking-tight">Artificial</h1>
          <p class="text-ink-muted text-xs">Civilization Engine</p>
        </div>
      </div>

      <div class="w-full sm:flex-1 sm:min-w-0">
        <EraStrip />
      </div>
    </header>

    <nav aria-label="Game sections" bind:clientHeight={navHeight} class="section-nav sticky top-0 z-20 gap-2 p-2 mb-2 bg-surface-1 border border-ink/15 rounded-lg">
      <a class="btn btn-ghost px-2 text-xs sm:text-sm" href="#resources">Resources</a>
      <a class="btn btn-ghost px-2 text-xs sm:text-sm" href="#actions">Actions</a>
      <a class="btn btn-ghost px-2 text-xs sm:text-sm" href="#workers">Workers</a>
    </nav>
    <nav aria-label="Progress and recovery" class="flex flex-wrap gap-2 mb-4">
      <a class="btn btn-ghost" href="#upgrades">Upgrades</a>
      <a class="btn btn-ghost" href="#save-tools">Save &amp; recovery</a>
    </nav>
    <NotificationToast />
    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
      <!-- Sidebar -->
      <aside class="card lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div class="card-header">
          <h2 id="resources" tabindex="-1" class="panel-title">Resources</h2>
        </div>
        <div class="p-4 space-y-4">
          <EraCard />
          <ResourcePanel />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="min-w-0">
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
          <!-- Left Column -->
          <div class="space-y-4">
            <div class="card">
              <div class="card-body">
                <FlowPanel />
              </div>
            </div>

            <div class="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
              <div class="card">
                <div class="card-header">
                  <h2 id="actions" tabindex="-1" class="panel-title">Actions</h2>
                </div>
                <div class="card-body">
                  <ActionButtons />
                </div>
              </div>

              <div class="card">
                <div class="card-body">
                  <div id="workers" tabindex="-1"><WorkerPanel /></div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 id="upgrades" tabindex="-1" class="panel-title">Upgrades</h2>
              </div>
              <div class="card-body">
                <UpgradeGrid />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <CivSpecializationPanel />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <TradeRoutePanel />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <WonderPanel />
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <div class="card">
              <div class="card-body">
                <AchievementGrid />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <PrestigePanel />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <LogPanel />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <PrivacySettings />
{/if}
