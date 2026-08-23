<script>
  import { gameStore } from '../stores/gameStore.js';
  import {
    formatCost,
    formatId,
    formatResourceName,
    getResourceIcon,
  } from '../utils/gameFormatting.js';
  import { getWorkerFoodResource } from '../utils/populationSupport.js';

  let workerDefs = $derived($gameStore.workerViews);
  let eraFood = $derived(getWorkerFoodResource($gameStore.currentEra));
  let eraFoodLabel = $derived(`${getResourceIcon(eraFood, '')} ${formatResourceName(eraFood)}`.trim());

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
      {@const isStarving = workerCount > 0 && worker.foodStatus === 'starving'}
      {@const isHungry = workerCount > 0 && worker.foodStatus === 'hungry'}

      <div
        class="item-card"
        class:locked={!hasRequiredUpgrade}
        class:border-danger-muted={worker.inputStarved || isStarving}
      >
        <div class="flex justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-paper mb-1 flex items-center gap-2 flex-wrap">
              {worker.name}
              {#if worker.inputStarved}
                <span class="text-[0.7rem] font-semibold px-1.5 py-0.5 rounded bg-danger/15 border border-danger-muted text-danger">
                  Idle
                </span>
              {:else if isStarving}
                <span class="text-[0.7rem] font-semibold px-1.5 py-0.5 rounded bg-danger/15 border border-danger-muted text-danger">
                  Starving — feed {eraFoodLabel}
                </span>
              {:else if isHungry}
                <span class="text-[0.7rem] font-semibold px-1.5 py-0.5 rounded bg-warning/15 border border-warning/30 text-warning">
                  Hungry
                </span>
              {/if}
            </h4>
            <p class="text-xs text-ink-muted line-clamp-2 mb-2 leading-tight">{worker.description}</p>

            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted leading-tight">
              <span>Cost: {formatCost(actualCost)}</span>
              <span class="flex items-center gap-1">
                Owned: {workerCount}
                {#if workerCount > 0 && !worker.inputStarved && !isStarving}
                  {@const eff = worker.efficiencyPct || 100}
                  <span
                    class="font-medium"
                    class:text-success={!isHungry}
                    class:text-warning={isHungry}
                  >
                    {eff}%
                  </span>
                {/if}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-end justify-between shrink-0">
            {#if worker.inputStarved}
              <span class="text-xs text-danger font-semibold text-right leading-tight">
                Idle — out of {getResourceIcon(worker.starvedInput, '')}
                {formatResourceName(worker.starvedInput)}
              </span>
            {:else if !hasRequiredUpgrade}
              <span class="text-xs text-warning">Requires: {formatId(worker.requiresUpgrade)}</span>
            {:else if !hasPopulation}
              <span class="text-xs text-warning leading-tight text-right">Need population</span>
            {:else if !canAfford}
              <span class="text-xs text-ink-muted">Need resources</span>
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
