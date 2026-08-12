<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, formatResourceName } from '../utils/gameFormatting.js';

  let workerDefs = $derived($gameStore.workerViews);

  function hireWorker(workerId) {
    gameStore.hireWorker(workerId);
  }

  let workerStatus = $derived(() => {
    const entries = Object.entries($gameStore.workers).filter(([_, count]) => count > 0);
    const available = $gameStore.availablePopulation;
    if (entries.length === 0) return `Available population: ${available}`;
    return `${entries.map(([type, count]) => `${formatResourceName(type)}: ${count}`).join(', ')} - Available: ${available}`;
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="panel-title">Workers</h2>
    <span class="text-xs text-ink-muted">{workerStatus()}</span>
  </div>

  <div class="space-y-3">
    {#each workerDefs as worker (worker.id)}
      {@const workerCount = worker.count || 0}
      {@const actualCost = worker.cost}
      {@const canAfford = worker.canAfford}
      {@const hasRequiredUpgrade = worker.requirementMet}
      {@const hasPopulation = worker.hasAvailablePopulation}
      {@const canHire = worker.canHire}

      <div class="item-card" class:locked={!hasRequiredUpgrade}>
        <div class="flex justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-paper mb-1">{worker.name}</h4>
            <p class="text-xs text-ink-muted line-clamp-2 mb-2">{worker.description}</p>

            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span>Cost: {formatCost(actualCost)}</span>
              <span class="flex items-center gap-1">
                Owned: {workerCount}
                {#if workerCount > 0}
                  {@const eff = worker.efficiencyPct || 100}
                  {@const foodStatus = worker.foodStatus || 'wellFed'}
                  <span
                    class="font-medium"
                    class:text-success={foodStatus === 'wellFed'}
                    class:text-warning={foodStatus === 'hungry'}
                    class:text-danger={foodStatus === 'starving'}
                  >
                    {eff}%
                  </span>
                {/if}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-end justify-between shrink-0">
            {#if !hasRequiredUpgrade}
              <span class="text-[0.65rem] text-warning">Requires: {worker.requiresUpgrade}</span>
            {:else if !hasPopulation}
              <span class="text-[0.65rem] text-warning">Need population</span>
            {:else if !canAfford}
              <span class="text-[0.65rem] text-ink-muted">Need resources</span>
            {:else}
              <span></span>
            {/if}
            <button
              class="btn btn-sm"
              class:btn-primary={canHire}
              class:btn-secondary={!canHire}
              disabled={!canHire}
              onclick={() => hireWorker(worker.id)}
            >
              {!hasRequiredUpgrade ? 'Locked' : 'Hire'}
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
