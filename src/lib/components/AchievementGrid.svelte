<script>
  import { gameStore } from '../stores/gameStore.js';

  let achievements = $derived($gameStore.achievements || []);
  let unlockedCount = $derived(achievements.filter(ach => ach.unlocked).length);
  let totalCount = $derived(achievements.length);
  let selectedAchievement = $state(null);

  function openAchievement(achievement) {
    selectedAchievement = achievement;
  }

  function closeAchievement() {
    selectedAchievement = null;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeAchievement();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="panel-title">Achievements</h2>
    <span class="px-2.5 py-1 text-xs font-medium bg-surface-2 border border-ink/10 rounded-full text-ink-soft tabular-nums">
      {unlockedCount} / {totalCount}
    </span>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
    {#each achievements as ach (ach.id)}
      <button
        type="button"
        class="group relative flex min-h-16 w-full cursor-pointer items-center gap-2.5 p-2.5 bg-surface-2 border border-ink/10 rounded-lg transition-all text-left hover:bg-surface-3 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        class:opacity-40={!ach.unlocked}
        class:cursor-help={ach.unlocked}
        aria-label={ach.unlocked ? `${ach.name}: ${ach.description}` : 'Locked achievement details'}
        onclick={() => openAchievement(ach)}
      >
        <span class="w-8 h-8 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-md text-lg shrink-0">
          {ach.unlocked ? ach.icon : '?'}
        </span>
        <div class="min-w-0">
          <span class="block text-xs font-semibold text-ink truncate">
            {ach.unlocked ? ach.name : '???'}
          </span>
          <span class="block text-[0.65rem] text-ink-muted truncate">
            {ach.unlocked ? ach.description : 'Locked'}
          </span>
        </div>

        {#if ach.unlocked}
          <span class="pointer-events-none absolute left-0 top-full z-40 mt-2 hidden w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-accent/40 bg-surface-1 p-3 shadow-2xl shadow-black/50 group-hover:block group-focus-visible:block sm:left-auto sm:right-0">
            <span class="mb-2 flex items-center gap-2">
              <span class="text-lg">{ach.icon}</span>
              <span class="min-w-0">
                <span class="block truncate text-xs font-bold text-paper">{ach.name}</span>
                <span class="block text-[0.65rem] font-semibold uppercase tracking-wide text-accent">{ach.category}</span>
              </span>
            </span>
            <span class="block text-[0.7rem] leading-snug text-ink-soft">
              {ach.objective}
            </span>
            <span class="mt-2 block text-[0.7rem] leading-snug text-ink-muted">
              {ach.effect}
            </span>
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>

{#if selectedAchievement}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
    <button
      type="button"
      class="absolute inset-0 h-full w-full cursor-default"
      aria-label="Close achievement details"
      onclick={closeAchievement}
    ></button>

    <div
      class="relative z-10 w-full max-w-md rounded-card border border-ink/15 bg-surface-1 shadow-2xl shadow-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-detail-title"
    >
      <div class="flex items-start justify-between gap-4 border-b border-ink/10 p-4">
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-2xl">
            {selectedAchievement.unlocked ? selectedAchievement.icon : '?'}
          </span>
          <div class="min-w-0">
            <h3 id="achievement-detail-title" class="truncate text-base font-bold text-paper">
              {selectedAchievement.unlocked ? selectedAchievement.name : 'Locked Achievement'}
            </h3>
            <p class="text-xs font-semibold uppercase tracking-wide text-accent">
              {selectedAchievement.unlocked ? selectedAchievement.category : 'Undiscovered'}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ink/10 bg-ink/5 text-sm font-bold text-ink-soft transition-colors hover:bg-ink/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Close achievement details"
          onclick={closeAchievement}
        >
          X
        </button>
      </div>

      <div class="space-y-4 p-4">
        {#if selectedAchievement.unlocked}
          <div>
            <p class="section-label mb-1">Unlocked By</p>
            <p class="text-sm leading-relaxed text-ink-soft">{selectedAchievement.objective}</p>
          </div>

          <div>
            <p class="section-label mb-1">Purpose</p>
            <p class="text-sm leading-relaxed text-ink-soft">{selectedAchievement.purpose}</p>
          </div>

          <div>
            <p class="section-label mb-1">Gameplay Effect</p>
            <p class="text-sm leading-relaxed text-ink-soft">{selectedAchievement.effect}</p>
          </div>
        {:else}
          <div>
            <p class="section-label mb-1">Status</p>
            <p class="text-sm leading-relaxed text-ink-soft">This achievement has not been unlocked yet.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
