<script>
  import { onMount } from 'svelte';
  import { gameStore } from '../stores/gameStore.js';
  import { formatAmount, formatCost, getResourceIcon } from '../utils/gameFormatting.js';

  let actions = $derived($gameStore.actions);

  // transient "+N" labels spawned from the actual performAction result
  let gainLabels = $state([]);
  let nextLabelId = 0;

  function spawnGainLabels(actionId, result) {
    if (!result || result.failed) return;
    for (const [resource, amount] of Object.entries(result)) {
      const id = ++nextLabelId;
      gainLabels.push({ id, actionId, icon: getResourceIcon(resource, ''), amount });
      setTimeout(() => {
        gainLabels = gainLabels.filter((label) => label.id !== id);
      }, 900);
    }
  }

  function performAction(actionId) {
    const result = gameStore.performAction(actionId);
    spawnGainLabels(actionId, result);
  }

  // number keys 1..N fire the Nth visible action
  function handleKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
    const target = event.target;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }
    const index = Number.parseInt(event.key, 10) - 1;
    if (!Number.isInteger(index) || index < 0) return;
    const action = actions[index];
    if (action && action.canAfford && !action.isOnCooldown) performAction(action.id);
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="space-y-2">
  {#each actions as action, index (action.id)}
    <button
      class="group relative w-full flex items-center gap-4 p-4 rounded-lg bg-surface-2 border border-ink/10
             text-left transition-all duration-150 overflow-hidden active:scale-[0.98]
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

      {#each gainLabels.filter((label) => label.actionId === action.id) as label (label.id)}
        <span
          class="animate-float-up pointer-events-none absolute right-4 top-2 z-10 text-sm font-bold text-success tabular-nums drop-shadow"
        >
          +{formatAmount(label.amount)} {label.icon}
        </span>
      {/each}

      <span
        class="absolute right-3 bottom-2 text-[0.7rem] leading-none text-ink-muted border border-ink/15 rounded px-1 tabular-nums"
        aria-hidden="true"
      >
        {index + 1}
      </span>

      <span class="relative w-10 h-10 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-lg text-xl shrink-0 transition-transform group-hover:scale-105">
        {action.icon}
      </span>
      <div class="relative min-w-0 flex-1">
        <span class="block text-paper font-semibold">{action.name}</span>
        <span class="block text-xs text-ink-muted truncate">{action.description}</span>
        <span class="mt-2 flex flex-wrap gap-1.5 text-xs leading-none">
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

  @keyframes float-up {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-16px);
      opacity: 0;
    }
  }

  .animate-float-up {
    animation: float-up 0.9s ease-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-cooldown {
      animation: none;
      transform: scaleX(0);
    }

    .animate-float-up {
      animation: none;
      opacity: 0;
    }
  }
</style>
