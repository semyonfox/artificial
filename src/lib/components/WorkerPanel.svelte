<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, formatResourceName } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());
  let workerDefs = $derived(eraData?.workers || []);

  function getWorkerInfo(workerId) {
    return $gameStore.gameManager?.systems?.workerManager?.getWorkerInfo(workerId);
  }

  function hireWorker(workerId) {
    $gameStore.gameManager?.hireWorker(workerId);
    gameStore.refresh();
  }

  let workerStatus = $derived(() => {
    const entries = Object.entries($gameStore.workers).filter(([_, count]) => count > 0);
    if (entries.length === 0) return 'No workers hired';
    return entries.map(([type, count]) => `${formatResourceName(type)}: ${count}`).join(', ');
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="panel-title">Workers</h2>
    <span class="text-xs text-ink-muted">{workerStatus()}</span>
  </div>

  <div class="space-y-3">
    {#each workerDefs as worker (worker.id)}
      {@const info = getWorkerInfo(worker.id)}
      {@const workerCount = info?.count || 0}
      {@const actualCost = info?.cost || worker.cost}
      {@const canAfford = $gameStore.gameState?.canAfford(actualCost) ?? false}
      {@const hasRequiredUpgrade = info?.requirementMet ?? true}
      {@const canHire = canAfford && hasRequiredUpgrade}

      <div class="item-card" class:locked={!hasRequiredUpgrade}>
        <div class="flex justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-paper mb-1">{worker.name}</h4>
            <p class="text-xs text-ink-muted line-clamp-2 mb-2">{worker.description}</p>

            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span>Cost: {formatCost(actualCost)}</span>
              <span class="flex items-center gap-1">
                Owned: {workerCount}
                {#if workerCount > 0 && info}
                  {@const eff = info.efficiencyPct || 100}
                  {@const foodStatus = info.foodStatus || 'wellFed'}
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
