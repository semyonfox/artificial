<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, formatId, getPurchaseButtonClasses } from '../utils/gameFormatting.js';

  let upgradeDefs = $derived($gameStore.upgradeViews);

  // scannable order: affordable first, then locked, purchased sink to bottom
  let sortedUpgrades = $derived.by(() => {
    const rank = (upgrade) => {
      if (upgrade.isUnlocked) return 3;
      if (upgrade.canBuy) return 0;
      if (!upgrade.hasRequiredUpgrade) return 2;
      return 1;
    };
    return upgradeDefs
      .map((upgrade, index) => ({ upgrade, index }))
      .sort((a, b) => {
        const diff = rank(a.upgrade) - rank(b.upgrade);
        return diff !== 0 ? diff : a.index - b.index;
      })
      .map(({ upgrade }) => upgrade);
  });

  function buyUpgrade(upgradeId) {
    gameStore.buyUpgrade(upgradeId);
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {#each sortedUpgrades as upgrade (upgrade.id)}
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
        <p class="text-xs text-warning leading-tight mb-2">Requires: {formatId(upgrade.requiresUpgrade)}</p>
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
