<script>
  import { tick } from "svelte";
  import { gameStore } from '../stores/gameStore.js';
  import { formatNumber, getPurchaseButtonClasses } from '../utils/gameFormatting.js';

  let prestige = $derived($gameStore.prestige || { evolutionPoints: 0, totalResets: 0 });
  let prestigeView = $derived($gameStore.prestigeView);
  let canPrestige = $derived(prestigeView.canPrestige);
  let epGain = $derived(prestigeView.epGain);
  let multiplier = $derived(prestigeView.multiplier);
  let tree = $derived(prestigeView.talentTree);
  let hasPrestigeContent = $derived(canPrestige || (prestige.evolutionPoints > 0) || prestige.totalResets > 0);

  let tiers = $derived.by(() => {
    const grouped = {};
    tree.forEach(perk => {
      if (!grouped[perk.tier]) grouped[perk.tier] = [];
      grouped[perk.tier].push(perk);
    });
    return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
  });

  const tierNames = {
    1: 'Early Game',
    2: 'Growth',
    3: 'Cost Reduction',
    4: 'Advanced',
    5: 'Era Mastery',
    6: 'Deep Production',
  };

  async function doPrestige() {
    const result = gameStore.performPrestige();
    if (typeof result === "number") { await tick(); document.getElementById("prestige-title")?.focus(); }
  }

  async function buyPerk(perkId) {
    if (gameStore.buyPerk(perkId)) { await tick(); document.getElementById(`perk-${perkId}`)?.focus(); }
  }
</script>

<div class="space-y-4">
  <h2 id="prestige-title" tabindex="-1" class="panel-title">Prestige</h2>

  {#if !hasPrestigeContent}
    <p class="text-xs text-ink-muted py-1">
      ✨ Prestige — resets this run for permanent bonuses. Unlocks when you reach Neolithic.
    </p>
  {:else}
    <p class="text-xs text-ink-muted">Production multiplier grows with lifetime Evolution Points earned and your perks. Spending EP does not lower it. Perks are permanent.</p>

    <div class="grid grid-cols-2 gap-2">
      <div class="stat-box">
        <span class="section-label">EP</span>
        <strong class="block text-lg text-paper tabular-nums mt-1">{formatNumber(prestige.evolutionPoints)}</strong>
      </div>
      <div class="stat-box">
        <span class="section-label">Multiplier</span>
        <strong class="block text-lg text-paper tabular-nums mt-1">{multiplier.toFixed(1)}x</strong>
      </div>
      <div class="stat-box">
        <span class="section-label">Resets</span>
        <strong class="block text-lg text-paper tabular-nums mt-1">{prestige.totalResets}</strong>
      </div>
      <div class="stat-box">
        <span class="section-label">EP Gain</span>
        <strong class="block text-lg text-success tabular-nums mt-1">+{formatNumber(epGain)}</strong>
      </div>
    </div>

    <p class="text-sm text-ink-muted leading-relaxed">Prestige returns to Paleolithic and clears resources, population, workers, upgrades, paths and trade routes. Prestige points and perks, achievements and wonders stay. Export first if you want a copy of this run.</p>
    <button
      class="btn w-full"
      class:btn-primary={canPrestige}
      class:btn-secondary={!canPrestige}
      disabled={!canPrestige}
      onclick={doPrestige}
    >
      {canPrestige ? `Prestige (+${formatNumber(epGain)} EP)` : 'Prestige (reach Neolithic)'}
    </button>

    {#if tree.length > 0}
      <div class="space-y-4 pt-2">
        {#each tiers as [tier, perks] (tier)}
          <div>
            <h3 class="section-label mb-2">Tier {tier}: {tierNames[tier] || ''}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each perks as perk (perk.id)}
                <div
                  class="item-card flex flex-col items-start justify-between gap-2"
                  class:purchased={perk.purchased}
                  class:affordable={perk.available && !perk.purchased}
                  class:locked={!perk.available && !perk.purchased}
                >
                  <div class="min-w-0">
                    <h4 id={`perk-${perk.id}`} tabindex="-1" class="text-sm font-semibold text-ink">{perk.name}</h4>
                    <span class="block text-xs text-ink-muted leading-tight">{perk.description}</span>
                  </div>
                  <button
                    class="btn btn-sm shrink-0 {getPurchaseButtonClasses(perk.purchased, perk.available)}"
                    disabled={perk.purchased || !perk.available}
                    aria-label={perk.purchased ? `${perk.name}, purchased` : `Buy ${perk.name} for ${perk.cost} EP`}
                    onclick={() => buyPerk(perk.id)}
                  >
                    {perk.purchased ? '✓ Purchased' : `${perk.cost} EP`}
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-ink-muted text-center py-2">Prestige to unlock talents</p>
    {/if}
  {/if}
</div>
