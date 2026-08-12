<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, getPurchaseButtonClasses, getResourceIcon } from '../utils/gameFormatting.js';

  let availableWonders = $derived($gameStore.availableWonders);
  let builtWonders = $derived($gameStore.wonders?.built || []);
  let builtWonderViews = $derived(availableWonders.filter((wonder) => builtWonders.includes(wonder.id)));
  let isBronzeOrLater = $derived($gameStore.isBronzeOrLater);
  let hasChosenCiv = $derived($gameStore.hasCivSpecialization);

  function buildWonder(wonderId) {
    gameStore.buildWonder(wonderId);
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="panel-title">Wonders of the World</h3>
    <p class="text-xs text-ink-muted">Build monumental wonders for permanent production bonuses. Wonders persist through prestige.</p>
  </div>

  {#if builtWonders.length > 0}
    <div class="stat-box">
      <span class="section-label">Built Wonders ({builtWonders.length})</span>
      <div class="flex flex-wrap gap-2 mt-2">
        {#each builtWonderViews as wonder (wonder.id)}
          <span class="inline-flex items-center gap-1 bg-success/20 text-success text-xs px-2 py-1 rounded" title={wonder.name || wonder.id}>
            {wonder.icon || '🏛️'} {wonder.name || wonder.id}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  {#if availableWonders.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each availableWonders as wonder (wonder.id)}
        {@const isBuilt = wonder.isBuilt}
        <div
          class="item-card flex flex-col"
          class:purchased={isBuilt}
          class:affordable={wonder.canBuild && !isBuilt}
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">{wonder.icon || '🏛️'}</span>
            <div>
              <h4 class="text-sm font-bold text-paper">{wonder.name}</h4>
              <span class="text-[0.6rem] text-ink-muted">{wonder.civilization} • {wonder.era}</span>
            </div>
          </div>

          <p class="text-xs text-ink-muted mb-2">{wonder.description}</p>

          <div class="space-y-1 text-[0.65rem] text-ink-muted mb-3">
            <p><span class="font-semibold">Cost:</span> {formatCost(wonder.cost)}</p>
            <div>
              <span class="font-semibold">Bonuses:</span>
              {#each Object.entries(wonder.bonuses || {}) as [resource, mult]}
                <span class="inline-block bg-paper/10 rounded px-1 mr-1">
                  {getResourceIcon(resource)} ×{mult}
                </span>
              {/each}
            </div>
          </div>

          {#if wonder.historical}
            <p class="text-[0.6rem] text-ink-muted italic mb-2 line-clamp-2">{wonder.historical}</p>
          {/if}

          <div class="mt-auto">
            <button
              class="btn btn-sm w-full {getPurchaseButtonClasses(isBuilt, wonder.canBuild)}"
              disabled={isBuilt || !wonder.canBuild}
              onclick={() => buildWonder(wonder.id)}
            >
              {isBuilt ? '✓ Built' : 'Build Wonder'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else if builtWonders.length === 0}
    <div class="stat-box text-center">
      <p class="text-xs text-ink-muted">
        {#if !isBronzeOrLater}
          Advance to Bronze Age to unlock wonders.
        {:else if !hasChosenCiv}
          Choose a civilization path to reveal its wonders.
        {:else}
          No wonders are currently buildable for this run.
        {/if}
      </p>
    </div>
  {:else}
    <p class="text-xs text-ink-muted text-center py-4">No new wonders available in this era</p>
  {/if}
</div>
