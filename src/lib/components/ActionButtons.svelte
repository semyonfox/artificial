<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost } from '../utils/gameFormatting.js';

  let actions = $derived($gameStore.actions);

  function performAction(actionId) {
    gameStore.performAction(actionId);
  }
</script>

<div class="space-y-2">
  {#each actions as action (action.id)}
    <button
      class="group relative w-full flex items-center gap-4 p-4 rounded-lg bg-surface-2 border border-ink/10
             text-left transition-all duration-150 overflow-hidden
             hover:bg-surface-3 hover:border-accent/30 hover:-translate-y-0.5
             disabled:hover:translate-y-0 disabled:hover:border-ink/10 disabled:hover:bg-surface-2"
      class:opacity-60={!action.canAfford && !action.isOnCooldown}
      disabled={action.isOnCooldown || !action.canAfford}
      title={action.description}
      onclick={() => performAction(action.id)}
    >
      {#if action.isOnCooldown}
        <div
          class="absolute inset-0 bg-accent/20 origin-left animate-cooldown"
          style={`--cooldown-duration: ${action.cooldownRemaining}ms; --cooldown-progress: ${action.cooldownRemaining / action.cooldownMs}`}
        ></div>
      {/if}

      <span class="relative w-10 h-10 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-lg text-xl shrink-0 transition-transform group-hover:scale-105">
        {action.icon}
      </span>
      <div class="relative min-w-0 flex-1">
        <span class="block text-paper font-semibold">{action.name}</span>
        <span class="block text-xs text-ink-muted truncate">{action.description}</span>
        <span class="mt-2 flex flex-wrap gap-1.5 text-[0.65rem] leading-none">
          {#if action.produces}
            <span class="px-1.5 py-1 rounded bg-success/10 text-success border border-success/20">
              + {formatCost(action.produces)}
            </span>
          {/if}
          {#if action.consumes}
            <span
              class="px-1.5 py-1 rounded border {action.canAfford ? 'bg-ink/5 text-ink-muted border-ink/10' : 'bg-danger/10 text-danger border-danger/20'}"
            >
              - {formatCost(action.consumes)}
            </span>
          {/if}
        </span>
      </div>
    </button>
  {/each}
</div>

<style>
  @keyframes cooldown-sweep {
    from {
      transform: scaleX(var(--cooldown-progress));
    }
    to {
      transform: scaleX(0);
    }
  }

  .animate-cooldown {
    transform: scaleX(var(--cooldown-progress));
    animation: cooldown-sweep var(--cooldown-duration) linear forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-cooldown {
      animation: none;
      transform: scaleX(0);
    }
  }
</style>
