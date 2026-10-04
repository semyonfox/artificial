<script>
  import { tick } from "svelte";
  import { gameStore } from '../stores/gameStore.js';
  import { formatNamedCost, formatId, formatResourceName, getMissingCost } from '../utils/gameFormatting.js';
  let workerDefs = $derived($gameStore.workerViews);
  let supportLabel = $derived($gameStore.populationView.supportResources.map(formatResourceName).join(' or '));
  async function hireWorker(workerId) {
    if (gameStore.hireWorker(workerId)) {
      await tick();
      document.getElementById(`worker-${workerId}`)?.focus();
    }
  }
</script>

<section class="space-y-4" aria-labelledby="workers-title">
  <h2 id="workers-title" class="panel-title">Workers</h2>
  <p class="text-sm text-ink-muted leading-relaxed">{$gameStore.availablePopulation} people available. Hiring assigns one person; population grows automatically. Workers use {supportLabel} for support and recover automatically on their next support cycle.</p>
  {#each workerDefs as worker (worker.id)}
    <div class="item-card" class:locked={!worker.requirementMet}>
      <h3 id={`worker-${worker.id}`} tabindex="-1" class="text-paper font-bold">{worker.name}</h3>
      <p class="text-sm text-ink-muted leading-relaxed mt-1">{worker.description}</p>
      <p class="text-sm text-ink-soft mt-2">Owned: {worker.count}. Duplicate-worker efficiency: {worker.efficiencyPct ?? 100}%.</p>
      <p class="text-sm text-ink-muted leading-relaxed">Base output per worker: {formatNamedCost(worker.produces)} per {(worker.effectiveInterval / 1000).toFixed(1)}s cycle. Bonuses, support and caps affect actual output.
        {#if worker.consumes}Inputs per worker per cycle: {formatNamedCost(worker.consumes)}.{/if}
      </p>
      {#if worker.inputStarved}<p class="text-sm text-warning mt-2">Idle — out of {formatResourceName(worker.starvedInput)}. Replenish inputs to resume.</p>
      {:else if worker.inputStatus === 'partialInputs'}<p class="text-sm text-warning mt-2">Limited inputs — only some workers can work.</p>{/if}
      {#if worker.count > 0 && worker.foodStatus !== 'wellFed'}<p class="text-sm text-warning mt-2">{worker.foodStatus === 'starving' ? 'Starving' : 'Hungry'} — replenish {supportLabel}. Output is reduced.</p>{/if}
      <div class="mt-3 flex flex-col gap-2 items-start">
        <p id={`worker-cost-${worker.id}`} class="text-sm text-ink-muted">Hire cost: {formatNamedCost(worker.cost)}.</p>
        <p id={`worker-state-${worker.id}`} class="text-sm text-warning">
          {#if !worker.requirementMet}Requires {formatId(worker.requiresUpgrade)}.{/if}
          {#if !worker.hasAvailablePopulation}No available person. Wait for population growth.{/if}
          {#if !worker.canAfford}Needs {getMissingCost(worker.cost, $gameStore.resources)}.{/if}
        </p>
        <button class="btn btn-sm {worker.canHire ? 'btn-primary' : 'btn-secondary'}"
          disabled={!worker.canHire} aria-describedby={`worker-cost-${worker.id} worker-state-${worker.id}`}
          onclick={() => hireWorker(worker.id)}>Hire {worker.name}</button>
      </div>
    </div>
  {/each}
</section>
