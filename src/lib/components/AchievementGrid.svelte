<script>
  import { gameStore } from '../stores/gameStore.js';

  let achievements = $derived($gameStore.achievements || []);
  let unlockedCount = $derived(achievements.filter(ach => ach.unlocked).length);
  let totalCount = $derived(achievements.length);
</script>

<p class="text-sm text-ink-muted mb-3">{unlockedCount} of {totalCount} unlocked.</p>
<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
        <span class="block text-xs text-ink-muted truncate">
          {ach.unlocked ? ach.description : 'Locked'}
        </span>
      </div>
    </div>
  {/each}
</div>
