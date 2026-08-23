<script>
  import { gameStore } from '../stores/gameStore.js';

  // fresh saves see a single quiet row instead of a wall of locked tiles;
  // it opens permanently once the first achievement lands
  let expanded = $state(false);

  let achievements = $derived($gameStore.achievements || []);
  let unlockedCount = $derived(achievements.filter(ach => ach.unlocked).length);
  let totalCount = $derived(achievements.length);
  let collapsed = $derived(unlockedCount === 0 && !expanded);
</script>

<div class="space-y-4">
  {#if collapsed}
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-ink-muted leading-tight">
        🏆 Achievements <span class="tabular-nums">{unlockedCount}/{totalCount}</span>
        — unlock your first by progressing
      </p>
      <button class="btn btn-ghost btn-sm shrink-0" onclick={() => (expanded = true)}>
        Show
      </button>
    </div>
  {:else}
    <div class="flex items-center justify-between">
      <h2 class="panel-title">Achievements</h2>
      <span class="px-2.5 py-1 text-xs font-medium bg-surface-2 border border-ink/10 rounded-full text-ink-soft tabular-nums">
        {unlockedCount} / {totalCount}
      </span>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {#each achievements as ach (ach.id)}
        <div
          class="flex items-center gap-2.5 p-2.5 bg-surface-2 border border-ink/10 rounded-lg transition-all"
          class:opacity-40={!ach.unlocked}
          class:hover:bg-surface-3={ach.unlocked}
        >
          <span class="w-8 h-8 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-md text-lg shrink-0">
            {ach.unlocked ? ach.icon : '?'}
          </span>
          <div class="min-w-0">
            <span class="block text-xs font-semibold text-ink truncate">
              {ach.unlocked ? ach.name : '???'}
            </span>
            <span class="block text-[0.7rem] text-ink-muted truncate">
              {ach.unlocked ? ach.description : 'Locked'}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
