<script>
  import { gameStore } from '../stores/gameStore.js';
  import { config } from '../../../js/core/config.js';

  let trm = $derived($gameStore.gameManager?.systems?.tradeRouteManager);
  let availableRoutes = $derived(trm?.getAvailableRoutes() || []);
  let activeRoutes = $derived($gameStore.tradeRoutes?.activeRoutes || []);

  function establishRoute(routeId) {
    $gameStore.gameManager?.establishTradeRoute(routeId);
    gameStore.refresh();
  }

  function formatCost(cost) {
    return Object.entries(cost || {})
      .map(([r, amt]) => `${amt} ${config.resourceIcons[r] || r}`)
      .join(', ');
  }

  function getButtonClasses(isActive, canAfford) {
    if (isActive) return 'bg-success/20 text-success border-success/30';
    if (canAfford) return 'btn-primary';
    return 'btn-secondary';
  }
</script>

{#if availableRoutes.length > 0 || activeRoutes.length > 0}
  <div class="space-y-3">
    <div>
      <h3 class="panel-title">Trade Routes</h3>
      <p class="text-xs text-ink-muted">Establish trade routes to boost resource production. Routes reset on prestige.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each availableRoutes as route (route.id)}
        {@const routeDef = config.tradeRoutes?.[route.id]}
        {@const isActive = activeRoutes.includes(route.id)}
        {@const canAfford = $gameStore.gameState?.canAfford(routeDef?.cost) ?? false}
        <div
          class="item-card flex flex-col"
          class:purchased={isActive}
          class:affordable={canAfford && !isActive}
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{routeDef?.icon || '🛤️'}</span>
            <h4 class="text-sm font-bold text-paper">{routeDef?.name || route.id}</h4>
          </div>
          <p class="text-xs text-ink-muted mb-2">{routeDef?.description}</p>

          <div class="space-y-1 text-[0.65rem] text-ink-muted mb-3">
            <p><span class="font-semibold">Era:</span> {routeDef?.unlockEra}</p>
            <p><span class="font-semibold">Cost:</span> {formatCost(routeDef?.cost)}</p>
            <div>
              <span class="font-semibold">Bonuses:</span>
              {#each Object.entries(routeDef?.bonuses || {}) as [resource, mult]}
                <span class="inline-block bg-paper/10 rounded px-1 mr-1">
                  {config.resourceIcons[resource] || resource} ×{mult}
                </span>
              {/each}
            </div>
          </div>

          {#if routeDef?.historical}
            <p class="text-[0.6rem] text-ink-muted italic mb-2 line-clamp-2">{routeDef.historical}</p>
          {/if}

          <div class="mt-auto">
            <button
              class="btn btn-sm w-full {getButtonClasses(isActive, canAfford)}"
              disabled={isActive || !canAfford}
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
          {#each activeRoutes as routeId}
            {@const routeDef = config.tradeRoutes?.[routeId]}
            <span class="inline-flex items-center gap-1 bg-success/20 text-success text-xs px-2 py-1 rounded">
              {routeDef?.icon || '🛤️'} {routeDef?.name || routeId}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
