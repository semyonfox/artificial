<script>
  import { onMount } from 'svelte';
  import { gameStore } from './lib/stores/gameStore.js';
  import { GameManager } from '../js/GameManager.js';

  import EraStrip from './lib/components/EraStrip.svelte';
  import EraCard from './lib/components/EraCard.svelte';
  import ResourcePanel from './lib/components/ResourcePanel.svelte';
  import ActionButtons from './lib/components/ActionButtons.svelte';
  import UpgradeGrid from './lib/components/UpgradeGrid.svelte';
  import WorkerPanel from './lib/components/WorkerPanel.svelte';
  import AchievementGrid from './lib/components/AchievementGrid.svelte';
  import PrestigePanel from './lib/components/PrestigePanel.svelte';
  import LogPanel from './lib/components/LogPanel.svelte';
  import NotificationToast from './lib/components/NotificationToast.svelte';

  let gameManager = $state(null);
  let loading = $state(true);

  onMount(() => {
    const gm = new GameManager();

    gm.initPromise.then(() => {
      gameManager = gm;
      gameStore.initialize(gm);
      loading = false;

      const interval = setInterval(() => {
        if (gm.initialized) {
          gameStore.refresh();
          const am = gm.systems?.achievementManager;
          if (am) {
            gameStore.updateAchievements(am.getAllAchievements());
          }
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        gm.destroy();
      };
    });

    window.game = gm;
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
        <div class="w-10 h-10 rounded-lg bg-surface-2 border border-accent/50 flex items-center justify-center relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-px h-full bg-accent/50"></div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="h-px w-full bg-accent/50"></div>
          </div>
        </div>
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
              <div class="card-header">
                <h2 class="panel-title">Actions</h2>
              </div>
              <div class="card-body">
                <ActionButtons />
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
                <AchievementGrid />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <LogPanel />
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <div class="card">
              <div class="card-body">
                <WorkerPanel />
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <PrestigePanel />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <NotificationToast />
{/if}
