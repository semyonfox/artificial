<script>
  import { gameStore } from '../stores/gameStore.js';
  import { formatCost, formatId, getMissingCost } from '../utils/gameFormatting.js';

  let upgrades = $derived($gameStore.upgradeViews);
  let pending = $derived(upgrades.filter((upgrade) => !upgrade.isUnlocked));
  let owned = $derived(upgrades.filter((upgrade) => upgrade.isUnlocked));
</script>

<section aria-labelledby="upgrades-title">
  <h2 id="upgrades-title" class="section-label mb-2">Upgrades</h2>

  {#if pending.length === 0}
    <p class="text-xs text-ink-muted px-1">All upgrades for this era bought.</p>
  {:else}
    <ul class="space-y-1.5">
      {#each pending as upgrade (upgrade.id)}
        <li>
          <button
            class="store-row"
            class:ready={upgrade.canBuy}
            disabled={!upgrade.canBuy}
            title={upgrade.description}
            onclick={() => gameStore.buyUpgrade(upgrade.id)}
          >
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline justify-between gap-2">
                <span class="text-sm font-semibold text-paper">{upgrade.name}</span>
                <span class="text-xs tabular-nums whitespace-nowrap {upgrade.canBuy ? 'text-paper' : 'text-ink-muted'}">
                  {upgrade.hasRequiredUpgrade ? formatCost(upgrade.adjustedCost) : `after ${formatId(upgrade.requiresUpgrade)}`}
                </span>
              </span>
              <span class="block text-xs text-ink-muted leading-snug">{upgrade.effect}</span>
            </span>
          </button>
          {#if upgrade.hasRequiredUpgrade && !upgrade.canAfford}
            <span class="sr-only">Needs {getMissingCost(upgrade.adjustedCost, $gameStore.resources)}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if owned.length > 0}
    <p class="mt-2 px-1 text-xs text-ink-muted leading-relaxed">
      <span class="text-success">✓</span> {owned.map((upgrade) => upgrade.name).join(' · ')}
    </p>
  {/if}
</section>
