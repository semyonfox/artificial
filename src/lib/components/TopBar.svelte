<script>
  import { gameStore } from '../stores/gameStore.js';
  import { getEraProgressPercent } from '../utils/gameFormatting.js';

  let { onOpen } = $props();

  let eraData = $derived($gameStore.currentEraData);
  let progress = $derived(getEraProgressPercent(eraData?.advancementCost, $gameStore.resources));
  let unlocked = $derived(($gameStore.achievements || []).filter((ach) => ach.unlocked).length);

  // something in the civilization menu is waiting on a choice or affordable
  let civReady = $derived(
    ($gameStore.civSpecializationChoices.length > 0 && !$gameStore.currentCivSpecialization) ||
      ($gameStore.eraSpecializationChoices.length > 0 && !$gameStore.currentEraSpecialization) ||
      $gameStore.availableRoutes.some((route) => route.canUnlock && !route.isActive) ||
      $gameStore.availableWonders.some((wonder) => wonder.canBuild),
  );

  let menu = $derived([
    { id: 'civilization', icon: '🏛️', label: 'Civilization', show: $gameStore.isBronzeOrLater, dot: civReady },
    { id: 'prestige', icon: '✨', label: 'Prestige', show: true, dot: $gameStore.prestigeView.canPrestige },
    { id: 'achievements', icon: '🏆', label: `${unlocked}/${($gameStore.achievements || []).length}`, show: true, dot: false },
    { id: 'log', icon: '📜', label: 'Log', show: true, dot: false },
    { id: 'settings', icon: '⚙️', label: 'Settings', show: true, dot: false },
  ]);
</script>

<header class="topbar">
  <div class="flex items-center gap-3 min-w-0">
    <img src="/logo.png" alt="" class="w-9 h-9 rounded-lg border border-accent/50 shrink-0" />
    <div class="min-w-0">
      <h1 class="text-sm font-bold uppercase tracking-wide text-paper leading-tight">Artificial</h1>
      <p class="text-xs text-ink-muted leading-tight truncate">
        Era {$gameStore.eraNumber} of {$gameStore.eraCount} · {eraData?.name}
      </p>
    </div>
  </div>

  <div class="hidden md:block flex-1 max-w-sm mx-4">
    <div class="progress-bar" role="progressbar" aria-label="Era progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
      <div class="progress-fill" style="width: {progress.toFixed(1)}%"></div>
    </div>
  </div>

  <nav aria-label="Menus" class="flex flex-wrap gap-1.5 justify-end">
    {#each menu.filter((item) => item.show) as item (item.id)}
      <button class="menu-btn" onclick={() => onOpen(item.id)} aria-label={item.id === 'achievements' ? `Achievements ${item.label}` : item.label}>
        <span aria-hidden="true">{item.icon}</span>
        <span class="hidden sm:inline">{item.label}</span>
        {#if item.dot}<span class="menu-dot" aria-label="needs attention"></span>{/if}
      </button>
    {/each}
  </nav>
</header>
