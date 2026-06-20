<script>
  import { onMount } from 'svelte';
  import { gameStore } from './lib/stores/gameStore.js';
  import { GameManager } from '../js/GameManager.js';

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

  onMount(() => {
    const gm = new GameManager();
    let interval = null;
    let destroyed = false;

    gm.initPromise.then(() => {
      if (destroyed) {
        gm.destroy();
        return;
      }

      gameStore.initialize(gm);
      loading = false;

      interval = setInterval(() => {
        if (gm.initialized) {
          gameStore.refresh();
        }
      }, 1000);
    });

    window.game = gm;

    return () => {
      destroyed = true;
      if (interval) clearInterval(interval);
      if (window.game === gm) {
        delete window.game;
      }
      gm.destroy();
    };
  });
</script>

{#if loading}
  <div class="flex items-center justify-center h-screen">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
      <p class="text-ink-muted text-lg">Loading game...</p>
    </div>
  </div>
{:else}
  <div class="max-w-[1680px] mx-auto p-4">
    <!-- Top Bar -->
    <header class="mb-4 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-1/95 border border-ink/10 rounded-card shadow-xl shadow-black/25">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="Artificial" class="w-10 h-10 rounded-lg border border-accent/50" />
        <div>
          <h1 class="text-paper font-bold uppercase tracking-tight">Artificial</h1>
          <p class="text-ink-muted text-xs">Civilization Engine</p>
        </div>
      </div>

      <EraStrip />
    </header>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
      <!-- Sidebar -->
      <aside class="card lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div class="card-header">
          <h2 class="panel-title">Resources</h2>
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
                  <h2 class="panel-title">Actions</h2>
                </div>
                <div class="card-body">
                  <ActionButtons />
                </div>
              </div>

              <div class="card">
                <div class="card-body">
                  <WorkerPanel />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="panel-title">Upgrades</h2>
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

  <NotificationToast />
{/if}
