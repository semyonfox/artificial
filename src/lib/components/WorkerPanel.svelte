<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, formatId, formatNamedCost, formatResourceName, getResourceIcon } from '../utils/gameFormatting.js';

  let workers = $derived($gameStore.workerViews);
  let supportLabel = $derived($gameStore.populationView.supportResources.map(formatResourceName).join(' or '));

  // only surface a status when something is wrong, healthy workers stay quiet
  function status(worker) {
    if (!worker.count) return null;
    if (worker.inputStarved) return { tone: 'danger', text: `Idle, no ${formatResourceName(worker.starvedInput)}` };
    if (worker.foodStatus === 'starving') return { tone: 'danger', text: `Starving, needs ${supportLabel}` };
    if (worker.foodStatus === 'hungry') return { tone: 'warning', text: `Hungry, needs ${supportLabel}` };
    if (worker.inputStatus === 'partialInputs') return { tone: 'warning', text: 'Short on inputs' };
    return null;
  }

  function blocker(worker) {
    if (!worker.requirementMet) return `Needs ${formatId(worker.requiresUpgrade)}`;
    if (!worker.hasAvailablePopulation) return 'No free people';
    return null;
  }
</script>

<section aria-labelledby="workers-title">
  <h2 id="workers-title" class="section-label mb-2">Workers</h2>
  <ul class="space-y-1.5">
    {#each workers as worker (worker.id)}
      {@const state = status(worker)}
      {@const blocked = blocker(worker)}
      <li>
        <button
          class="store-row"
          class:ready={worker.canHire}
          class:locked-row={!worker.requirementMet}
          disabled={!worker.canHire}
          title={`${worker.description} Makes ${formatNamedCost(worker.produces)} every ${(worker.effectiveInterval / 1000).toFixed(1)}s${worker.consumes ? ` from ${formatNamedCost(worker.consumes)}` : ''}.`}
          aria-label={`Hire ${worker.name}, owned ${worker.count}`}
          onclick={() => gameStore.hireWorker(worker.id)}
        >
          <span class="worker-icon" aria-hidden="true">{getResourceIcon(Object.keys(worker.produces || {})[0], '👷')}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-paper">{worker.name}</span>
            <span class="block text-xs tabular-nums {worker.canAfford ? 'text-ink-soft' : 'text-ink-muted'}">
              {blocked ?? formatCost(worker.cost)}
            </span>
            {#if state}
              <span class="block text-xs {state.tone === 'danger' ? 'text-danger' : 'text-warning'}">{state.text}</span>
            {/if}
          </span>
          <span class="worker-count tabular-nums" aria-hidden="true">{worker.count || ''}</span>
        </button>
      </li>
    {/each}
  </ul>
</section>
