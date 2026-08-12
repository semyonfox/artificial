<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, getPurchaseButtonClasses, getResourceIcon } from '../utils/gameFormatting.js';

  let availableRoutes = $derived($gameStore.availableRoutes);
  let activeRoutes = $derived($gameStore.tradeRoutes?.activeRoutes || []);
  let nextTradeRoute = $derived($gameStore.nextTradeRoute);
  let activeRouteViews = $derived(availableRoutes.filter((route) => activeRoutes.includes(route.id)));

  function establishRoute(routeId) {
    gameStore.establishTradeRoute(routeId);
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="panel-title">Trade Routes</h3>
    <p class="text-xs text-ink-muted">Establish trade routes to boost resource production. Routes reset on prestige.</p>
  </div>

  {#if availableRoutes.length > 0 || activeRoutes.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each availableRoutes as route (route.id)}
        {@const isActive = route.isActive}
        <div
          class="item-card flex flex-col"
          class:purchased={isActive}
          class:affordable={route.canUnlock && !isActive}
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{route.icon || '🛤️'}</span>
            <h4 class="text-sm font-bold text-paper">{route.name || route.id}</h4>
          </div>
          <p class="text-xs text-ink-muted mb-2">{route.description}</p>

          <div class="space-y-1 text-[0.65rem] text-ink-muted mb-3">
            <p><span class="font-semibold">Era:</span> {route.unlockEra}</p>
            <p><span class="font-semibold">Cost:</span> {formatCost(route.cost)}</p>
            <div>
              <span class="font-semibold">Bonuses:</span>
              {#each Object.entries(route.bonuses || {}) as [resource, mult]}
                <span class="inline-block bg-paper/10 rounded px-1 mr-1">
                  {getResourceIcon(resource)} ×{mult}
                </span>
              {/each}
            </div>
          </div>

          {#if route.historical}
            <p class="text-[0.6rem] text-ink-muted italic mb-2 line-clamp-2">{route.historical}</p>
          {/if}

          {#if !isActive && !route.canUnlock && route.reason}
            <p class="text-[0.65rem] text-warning mb-2">{route.reason}</p>
          {/if}

          <div class="mt-auto">
            <button
              class="btn btn-sm w-full {getPurchaseButtonClasses(isActive, route.canUnlock)}"
              disabled={isActive || !route.canUnlock}
              onclick={() => establishRoute(route.id)}
            >
              {isActive ? '✓ Established' : 'Establish'}
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if activeRoutes.length > 0}
      <div class="stat-box">
        <span class="section-label">Active Routes</span>
        <div class="flex flex-wrap gap-2 mt-1">
          {#each activeRouteViews as route (route.id)}
            <span class="inline-flex items-center gap-1 bg-success/20 text-success text-xs px-2 py-1 rounded">
              {route.icon || '🛤️'} {route.name || route.id}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="stat-box text-center">
      <p class="text-xs text-ink-muted">
        {#if nextTradeRoute}
          Trade routes unlock in {nextTradeRoute.eraName}.
        {:else}
          No trade routes are available for the current civilization choices.
        {/if}
      </p>
    </div>
  {/if}
</div>
