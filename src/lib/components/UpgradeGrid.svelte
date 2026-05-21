<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, getPurchaseButtonClasses } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());
  let upgradeDefs = $derived(eraData?.upgrades || []);

  function buyUpgrade(upgradeId) {
    $gameStore.gameManager?.buyUpgrade(upgradeId);
    gameStore.refresh();
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {#each upgradeDefs as upgrade (upgrade.id)}
    {@const isUnlocked = $gameStore.upgrades[upgrade.id] === true}
    {@const canAfford = !isUnlocked && ($gameStore.gameState?.canAfford(upgrade.cost) ?? false)}
    {@const hasRequiredUpgrade = !upgrade.requiresUpgrade || $gameStore.upgrades[upgrade.requiresUpgrade] === true}
    {@const canBuy = !isUnlocked && canAfford && hasRequiredUpgrade}

    <div
      class="item-card flex flex-col"
      class:purchased={isUnlocked}
      class:affordable={canBuy}
    >
      <h4 class="text-sm font-bold text-paper mb-1">{upgrade.name}</h4>
      <p class="text-xs text-ink-muted mb-2 line-clamp-2">{upgrade.description}</p>

      <div class="space-y-1 text-xs text-ink-muted mb-3">
        <p>Cost: {formatCost(upgrade.cost)}</p>
        <p>Effect: {upgrade.effect}</p>
      </div>

      {#if !hasRequiredUpgrade}
        <p class="text-[0.65rem] text-warning mb-2">Requires: {upgrade.requiresUpgrade}</p>
      {/if}

      {#if upgrade.historical}
        <p class="text-[0.6rem] text-ink-muted italic mb-2 line-clamp-2">{upgrade.historical}</p>
      {/if}

      <div class="mt-auto">
        <button
          class="btn btn-sm {getPurchaseButtonClasses(isUnlocked, canBuy)}"
          disabled={isUnlocked || !canBuy}
          onclick={() => buyUpgrade(upgrade.id)}
        >
          {isUnlocked ? '✓ Purchased' : 'Buy'}
        </button>
      </div>
    </div>
  {/each}
</div>
