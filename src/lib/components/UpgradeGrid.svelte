<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, getPurchaseButtonClasses } from '../utils/gameFormatting.js';

  let upgradeDefs = $derived($gameStore.upgradeViews);

  function buyUpgrade(upgradeId) {
    gameStore.buyUpgrade(upgradeId);
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {#each upgradeDefs as upgrade (upgrade.id)}
    {@const isUnlocked = upgrade.isUnlocked}
    {@const adjustedCost = upgrade.adjustedCost}
    {@const hasDiscount = upgrade.hasPrestigeDiscount}
    {@const hasRequiredUpgrade = upgrade.hasRequiredUpgrade}
    {@const canBuy = upgrade.canBuy}

    <div
      class="item-card flex flex-col"
      class:purchased={isUnlocked}
      class:affordable={canBuy}
    >
      <h4 class="text-sm font-bold text-paper mb-1">{upgrade.name}</h4>
      <p class="text-xs text-ink-muted mb-2 line-clamp-2">{upgrade.description}</p>

      <div class="space-y-1 text-xs text-ink-muted mb-3">
        <p>
          Cost: {formatCost(adjustedCost)}
          {#if hasDiscount}
            <span class="text-success"> discounted</span>
          {/if}
        </p>
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
