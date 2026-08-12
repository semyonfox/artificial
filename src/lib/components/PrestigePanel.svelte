<script>
  import { gameStore } from '../stores/gameStore.js';
  import { getChoiceButtonClasses, getPurchaseButtonClasses } from '../utils/gameFormatting.js';

  let prestige = $derived($gameStore.prestige || { evolutionPoints: 0, totalResets: 0 });
  let prestigeView = $derived($gameStore.prestigeView);
  let canPrestige = $derived(prestigeView.canPrestige);
  let epGain = $derived(prestigeView.epGain);
  let multiplier = $derived(prestigeView.multiplier);
  let tree = $derived(prestigeView.talentTree);

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

  function doPrestige() {
    gameStore.performPrestige();
  }

  function buyPerk(perkId) {
    gameStore.buyPerk(perkId);
  }

  let specs = $derived($gameStore.eraSpecializationChoices);
  let chosenSpec = $derived($gameStore.currentEraSpecialization);

  function chooseSpec(specId) {
    gameStore.chooseSpecialization(specId);
  }
</script>

<div class="space-y-4">
  <h2 class="panel-title">Prestige</h2>

  <p class="text-xs text-ink-muted">Production multiplier follows 1 + √EP × 0.3 (diminishing). Perks are permanent.</p>

  <div class="grid grid-cols-2 gap-2">
    <div class="stat-box">
      <span class="section-label">EP</span>
      <strong class="block text-lg text-paper tabular-nums mt-1">{prestige.evolutionPoints}</strong>
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
      <strong class="block text-lg text-success tabular-nums mt-1">+{epGain}</strong>
    </div>
  </div>

  <button
    class="btn w-full"
    class:btn-primary={canPrestige}
    class:btn-secondary={!canPrestige}
    disabled={!canPrestige}
    onclick={doPrestige}
  >
    {canPrestige ? `Prestige (+${epGain} EP)` : 'Prestige (reach Neolithic)'}
  </button>

  {#if tree.length > 0}
    <div class="space-y-4 pt-2">
      {#each tiers as [tier, perks] (tier)}
        <div>
          <h3 class="section-label mb-2">Tier {tier}: {tierNames[tier] || ''}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {#each perks as perk (perk.id)}
              <div
                class="item-card flex items-center justify-between gap-2"
                class:purchased={perk.purchased}
                class:affordable={perk.available && !perk.purchased}
                class:locked={!perk.available && !perk.purchased}
              >
                <div class="min-w-0">
                  <span class="block text-xs font-semibold text-ink">{perk.name}</span>
                  <span class="block text-[0.65rem] text-ink-muted">{perk.description}</span>
                </div>
                <button
                  class="btn btn-sm shrink-0 {getPurchaseButtonClasses(perk.purchased, perk.available)}"
                  disabled={perk.purchased || !perk.available}
                  onclick={() => buyPerk(perk.id)}
                >
                  {perk.purchased ? '✓' : `${perk.cost} EP`}
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

  {#if specs.length > 0}
    <div class="pt-2">
      <h3 class="section-label mb-2">Era Specialization (choose one)</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {#each specs as spec (spec.id)}
          {@const isChosen = chosenSpec === spec.id}
          {@const isLocked = chosenSpec && !isChosen}
          <div
            class="item-card"
            class:purchased={isChosen}
            class:locked={isLocked}
          >
            <span class="block text-xs font-semibold text-ink mb-1">{spec.name}</span>
            <span class="block text-[0.65rem] text-ink-muted mb-2">{spec.description}</span>
            <button
              class="btn btn-sm w-full {getChoiceButtonClasses(isChosen, isLocked)}"
              disabled={isChosen || isLocked}
              onclick={() => chooseSpec(spec.id)}
            >
              {isChosen ? '✓ Active' : isLocked ? 'Locked' : 'Choose'}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
