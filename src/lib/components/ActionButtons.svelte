<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, formatNamedCost, getMissingCost } from '../utils/gameFormatting.js';

  let actions = $derived($gameStore.actions);
  let resultMessage = $state('');
  // bumps every result so identical messages are still announced
  let resultNumber = $state(0);
  let floaters = $state([]);
  let floaterId = 0;
  let actionGroup;

  function performAction(action) {
    if (!action.canAfford || action.isOnCooldown) return;
    const result = gameStore.performAction(action.id);
    if (!result) return;
    resultNumber++;
    if (result.failed) {
      resultMessage = `${action.name}: nothing gained.`;
      return;
    }
    resultMessage = `${action.name}: gained ${formatNamedCost(result)}.`;
    const id = ++floaterId;
    floaters = [...floaters, { id, actionId: action.id, text: `+${formatCost(result)}` }];
    setTimeout(() => (floaters = floaters.filter((floater) => floater.id !== id)), 900);
  }

  // timing is fixed when the overlay mounts. snapshots arrive many times a
  // second and rewriting the duration mid-animation makes the sweep jump
  function sweep(node, { remaining, total }) {
    node.style.setProperty('--cooldown-duration', `${remaining}ms`);
    node.style.setProperty('--cooldown-progress', `${remaining / total}`);
  }

  function handleKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
    if (!/^[1-9]$/.test(event.key)) return;
    if (event.target.closest?.('input, textarea, select, dialog, [contenteditable="true"]')) return;
    const action = actions[Number(event.key) - 1];
    if (action) {
      event.preventDefault();
      performAction(action);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<section aria-labelledby="actions-title" bind:this={actionGroup}>
  <h2 id="actions-title" class="sr-only">Actions</h2>
  <div class="action-grid">
    {#each actions as action, index (action.id)}
      {@const blocked = !action.canAfford}
      <button
        class="action-tile"
        class:blocked
        class:cooling={action.isOnCooldown}
        aria-disabled={action.isOnCooldown || blocked}
        aria-keyshortcuts={`${index + 1}`}
        aria-describedby={`action-state-${action.id}`}
        onclick={() => performAction(action)}
      >
        {#if action.isOnCooldown}
          <span
            class="cooldown-sweep"
            aria-hidden="true"
            use:sweep={{ remaining: action.cooldownRemaining, total: action.cooldownMs }}
          ></span>
        {/if}
        <span class="action-key" aria-hidden="true">{index + 1}</span>
        <span class="action-icon" aria-hidden="true">{action.icon}</span>
        <span class="action-name">{action.name}</span>
        <span id={`action-state-${action.id}`} class="action-yield" class:text-warning={blocked}>
          {#if blocked}
            Needs {getMissingCost(action.consumes, $gameStore.resources)}
          {:else}
            <span aria-hidden="true">+{formatCost(action.produces)}{#if action.consumes}{' for '}{formatCost(action.consumes)}{/if}</span>
            <span class="sr-only">Makes {formatNamedCost(action.produces)}{#if action.consumes}, uses {formatNamedCost(action.consumes)}{/if}</span>
          {/if}
        </span>
        {#each floaters.filter((floater) => floater.actionId === action.id) as floater (floater.id)}
          <span class="floater" aria-hidden="true">{floater.text}</span>
        {/each}
      </button>
    {/each}
  </div>
  <p role="status" aria-live="polite" class="sr-only">{#if resultNumber > 0}Result {resultNumber}: {/if}{resultMessage}</p>
  <p class="mt-3 text-center text-xs text-ink-muted">Tip: number keys trigger actions.</p>
</section>
