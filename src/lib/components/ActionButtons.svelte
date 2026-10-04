<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatNamedCost, getMissingCost } from '../utils/gameFormatting.js';

  let actions = $derived($gameStore.actions);
  let resultMessage = $state('');
  let resultNumber = $state(0);
  let actionGroup;

  function performAction(action) {
    if (!action.canAfford || action.isOnCooldown) return;
    const result = gameStore.performAction(action.id);
    if (!result) return;
    resultNumber++;
    resultMessage = result.failed
      ? `${action.name}: no resources gained. Try again when ready.`
      : `${action.name}: gained ${formatNamedCost(result)}.`;
  }

  function handleKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
    if (!/^[1-9]$/.test(event.key) || !actionGroup?.contains(event.target)) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const action = actions[Number(event.key) - 1];
    if (action) {
      event.preventDefault();
      performAction(action);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />
<div class="space-y-3" bind:this={actionGroup}>
  <p class="text-sm text-ink-muted">Use Enter or Space on an action. Number keys work while focus is in this action list.</p>
  {#each actions as action, index (action.id)}
    <button
      class="action-control relative w-full flex items-start gap-3 p-4 rounded-lg bg-surface-2 border border-ink/15 text-left hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-disabled={action.isOnCooldown || !action.canAfford}
      aria-labelledby={`action-name-${action.id}`}
      aria-describedby={`action-description-${action.id} action-state-${action.id}`}
      aria-keyshortcuts={`${index + 1}`}
      onclick={() => performAction(action)}
    >
      <span aria-hidden="true" class="w-10 h-10 flex items-center justify-center bg-ink/5 rounded-lg text-xl shrink-0">{action.icon}</span>
      <span class="min-w-0 flex-1">
        <span id={`action-name-${action.id}`} class="block text-paper font-semibold">{action.name}</span>
        <span id={`action-description-${action.id}`} class="block text-sm text-ink-muted leading-relaxed">
          {action.description}{action.description.endsWith('.') ? '' : '.'}
          {#if action.produces} Produces {formatNamedCost(action.produces)}.{/if}
          {#if action.consumes} Uses {formatNamedCost(action.consumes)}.{/if}
        </span>
        <span id={`action-state-${action.id}`} class="block mt-2 text-sm {action.canAfford ? 'text-accent' : 'text-warning'}">
          {action.isOnCooldown ? 'Cooling down…' : !action.canAfford ? `Needs ${getMissingCost(action.consumes, $gameStore.resources)}` : 'Ready'}
        </span>
      </span>
      <span aria-hidden="true" class="text-sm text-ink-muted">{index + 1}</span>
    </button>
  {/each}
  <p role="status" aria-live="polite" aria-atomic="true" class="text-sm text-ink-soft min-h-6">{#if resultNumber > 0}<span class="sr-only">Result {resultNumber}: </span>{/if}{resultMessage}</p>
</div>
