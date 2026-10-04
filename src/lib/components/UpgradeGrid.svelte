<script>
  import { tick } from "svelte";
  import { gameStore } from '../stores/gameStore.js';
  import { formatNamedCost, formatId, getPurchaseButtonClasses } from '../utils/gameFormatting.js';

  let upgradeDefs = $derived($gameStore.upgradeViews);

  let sortedUpgrades = $derived(upgradeDefs);

  async function buyUpgrade(upgradeId) {
    if (gameStore.buyUpgrade(upgradeId)) {
      await tick();
      document.getElementById(`upgrade-${upgradeId}`)?.focus();
    }
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
      <h3 id={`upgrade-${upgrade.id}`} tabindex="-1" class="text-sm font-bold text-paper mb-1">{upgrade.name}</h3>
      <p class="text-xs text-ink-muted mb-2 leading-relaxed">{upgrade.description}</p>

      <div class="space-y-1 text-xs text-ink-muted mb-3">
        <p>
          Cost: {formatNamedCost(adjustedCost)}
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
        <p class="text-xs text-ink-muted italic mb-2 leading-relaxed">{upgrade.historical}</p>
      {/if}

      <div class="mt-auto">
        <button
          class="btn btn-sm {getPurchaseButtonClasses(isUnlocked, canBuy)}"
          disabled={isUnlocked || !canBuy}
          onclick={() => buyUpgrade(upgrade.id)}
        >
          {isUnlocked ? '✓ Purchased' : `Buy ${upgrade.name}`}
        </button>
      </div>
    </div>
  {/each}
</div>
