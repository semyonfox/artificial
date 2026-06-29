<script>
  import { gameStore } from '../stores/gameStore.js';
  import { config } from '../../../js/core/config.js';
  import {
    formatNumber,
    formatResourceName,
    getEraProgressPercent,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());
  let canAdvance = $derived($gameStore.gameState?.canAdvanceEra() ?? false);
  let totalClicks = $derived($gameStore.progression?.totalClicks || 0);
  let unlockedAchievements = $derived(($gameStore.achievements || []).filter(ach => ach.unlocked).length);
  let totalAchievements = $derived(($gameStore.achievements || []).length);

  let nextEra = $derived.by(() => {
    const currentIdx = config.eraOrder.indexOf($gameStore.currentEra);
    if (currentIdx < 0 || currentIdx >= config.eraOrder.length - 1) return null;

    const nextKey = config.eraOrder[currentIdx + 1];
    return config.eras?.[nextKey] || config.eraData?.[nextKey] || { name: nextKey };
  });

  let progressPercent = $derived.by(() => {
    return getEraProgressPercent(eraData?.advancementCost, $gameStore.resources);
  });

  let requirements = $derived.by(() => {
    return Object.entries(eraData?.advancementCost || {}).map(([resource, required]) => {
      const current = Math.floor($gameStore.resources[resource] || 0);
      return {
        resource,
        current,
        required,
        complete: current >= required,
      };
    });
  });

  function advanceEra() {
    $gameStore.gameManager?.advanceEra();
    gameStore.refresh();
  }
</script>

<section class="space-y-4">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div class="min-w-0">
      <p class="section-label mb-1">Current Objective</p>
      <h2 class="text-xl font-bold text-paper">
        {#if nextEra}
          Reach {nextEra.name}
        {:else}
          Final era reached
        {/if}
      </h2>
      <p class="text-sm text-ink-muted mt-1">
        {eraData?.name || 'Paleolithic Era'} progress: {progressPercent.toFixed(1)}%
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2 shrink-0 sm:grid-cols-3">
      <div class="stat-box">
        <p class="section-label">Actions</p>
        <p class="text-lg font-bold text-paper tabular-nums">{formatNumber(totalClicks)}</p>
      </div>
      <div class="stat-box">
        <p class="section-label">Achievements</p>
        <p class="text-lg font-bold text-paper tabular-nums">{unlockedAchievements}/{totalAchievements}</p>
      </div>
      <div class="stat-box col-span-2 sm:col-span-1">
        <p class="section-label">Era</p>
        <p class="text-lg font-bold text-paper tabular-nums">{config.eraOrder.indexOf($gameStore.currentEra) + 1}/{config.eraOrder.length}</p>
      </div>
    </div>
  </div>

  <div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progressPercent.toFixed(1)}%"></div>
    </div>
  </div>

  {#if requirements.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {#each requirements as req (req.resource)}
        <div
          class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border {req.complete ? 'bg-success/5 border-success/30' : 'bg-surface-2/70 border-ink/10'}"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-7 h-7 flex items-center justify-center rounded-md bg-ink/5 border border-ink/10 text-sm">
              {getResourceIcon(req.resource, '?')}
            </span>
            <span class="text-sm text-ink-soft truncate">{formatResourceName(req.resource)}</span>
          </div>
          <span
            class="text-sm font-semibold tabular-nums"
            class:text-success={req.complete}
            class:text-ink-muted={!req.complete}
          >
            {formatNumber(req.current)} / {formatNumber(req.required)}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="flex justify-end">
    <button
      class="btn"
      class:btn-primary={canAdvance}
      class:btn-secondary={!canAdvance}
      disabled={!canAdvance}
      onclick={advanceEra}
    >
      {canAdvance && nextEra ? `Advance to ${nextEra.name}` : 'Requirements not met'}
    </button>
  </div>
</section>
