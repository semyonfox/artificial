<script>
  import { gameStore } from '../stores/gameStore.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());
  let actions = $derived(eraData?.actions || []);

  let cooldowns = $state({});

  function isVisible(action) {
    if (!action.requiresUpgrade) return true;
    return $gameStore.upgrades[action.requiresUpgrade] === true;
  }

  function canAfford(action) {
    if (!action.consumes) return true;
    return $gameStore.gameState?.canAfford(action.consumes) ?? true;
  }

  function performAction(action) {
    if (cooldowns[action.id]) return;

    const gm = $gameStore.gameManager;
    if (!gm) return;

    gm.systems.resourceManager.performClickAction(action);
    gm.updateProgression(1);
    gameStore.refresh();

    const duration = action.cooldown || 1000;
    cooldowns[action.id] = { active: true, duration };

    setTimeout(() => {
      cooldowns[action.id] = null;
    }, duration);
  }
</script>

<div class="space-y-2">
  {#each actions as action (action.id)}
    {#if isVisible(action)}
      {@const cooldown = cooldowns[action.id]}
      {@const isOnCooldown = cooldown?.active}
      <button
        class="group relative w-full flex items-center gap-4 p-4 rounded-lg bg-surface-2 border border-ink/10
               text-left transition-all duration-150 overflow-hidden
               hover:bg-surface-3 hover:border-accent/30 hover:-translate-y-0.5
               disabled:hover:translate-y-0 disabled:hover:border-ink/10 disabled:hover:bg-surface-2"
        class:opacity-60={!canAfford(action) && !isOnCooldown}
        disabled={isOnCooldown}
        title={action.description}
        onclick={() => performAction(action)}
      >
        {#if isOnCooldown}
          <div
            class="absolute inset-0 bg-accent/20 origin-left animate-cooldown"
            style="--cooldown-duration: {cooldown.duration}ms"
          ></div>
        {/if}

        <span class="relative w-10 h-10 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-lg text-xl shrink-0 transition-transform group-hover:scale-105">
          {action.icon}
        </span>
        <div class="relative min-w-0 flex-1">
          <span class="block text-paper font-semibold">{action.name}</span>
          <span class="block text-xs text-ink-muted truncate">{action.description}</span>
        </div>
      </button>
    {/if}
  {/each}
</div>

<style>
  @keyframes cooldown-sweep {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }

  .animate-cooldown {
    animation: cooldown-sweep var(--cooldown-duration) linear forwards;
  }
</style>
