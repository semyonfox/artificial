<script>
  import { gameStore } from '../stores/gameStore.js';
  import {
    formatEraName,
    getChoiceButtonClasses,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  let civSpecs = $derived($gameStore.civSpecializationChoices);
  let chosenCiv = $derived($gameStore.currentCivSpecialization);
  let nextCivSpecialization = $derived($gameStore.nextCivSpecialization);
  let hasCivContent = $derived(civSpecs.length > 0 || Boolean(chosenCiv) || $gameStore.hasCivSpecialization);

  // era specializations moved here from PrestigePanel: they are mid-run
  // choices, not prestige mechanics
  let eraSpecs = $derived($gameStore.eraSpecializationChoices);
  let chosenSpec = $derived($gameStore.currentEraSpecialization);

  function chooseCiv(civId) {
    gameStore.chooseCivSpecialization(civId);
  }

  function chooseSpec(specId) {
    gameStore.chooseSpecialization(specId);
  }

  let lockedLine = $derived(
    nextCivSpecialization
      ? `unlock in ${nextCivSpecialization.name}`
      : 'nothing to choose in this run',
  );
</script>

<div class="space-y-3">
  {#if !hasCivContent && eraSpecs.length === 0}
    <div class="py-2">
      <p class="text-xs text-ink-muted leading-tight">
        🔒 Paths &amp; Specializations: {lockedLine}
      </p>
    </div>
  {:else}
    <div>
      <h2 class="panel-title">Paths &amp; Specializations</h2>

      {#if civSpecs.length > 0}
        <p class="text-xs text-ink-muted mt-1 mb-3 leading-tight">
          Choose a civilization to specialize your production bonuses. This choice is permanent for this run.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each civSpecs as civ (civ.id)}
            {@const isChosen = chosenCiv === civ.id}
            {@const isLocked = chosenCiv && !isChosen}
            <div
              class="item-card flex flex-col"
              class:purchased={isChosen}
              class:locked={isLocked}
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg">{civ.icon || '🏛️'}</span>
                <h3 class="text-sm font-bold text-paper">{civ.name}</h3>
              </div>
              <p class="text-xs text-ink-muted mb-2 leading-tight">{civ.description}</p>

              <div class="text-xs text-ink-muted mb-3 leading-tight">
                <span class="font-semibold">Bonuses:</span>
                {#each Object.entries(civ.bonuses || {}) as [resource, mult]}
                  <span class="inline-block bg-paper/10 rounded px-1 mr-1">
                    {getResourceIcon(resource)} ×{mult}
                  </span>
                {/each}
              </div>

              {#if civ.historical}
                <p class="text-xs text-ink-muted italic mb-2 leading-relaxed leading-tight">{civ.historical}</p>
              {/if}

              <div class="mt-auto">
                <button
                  class="btn btn-sm w-full {getChoiceButtonClasses(isChosen, isLocked)}"
                  disabled={isChosen || isLocked}
                  onclick={() => chooseCiv(civ.id)}
                >
                  {isChosen ? '✓ Active' : isLocked ? 'Locked' : `Choose ${civ.name}`}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else if nextCivSpecialization}
        <p class="text-xs text-ink-muted mt-1">🔒 Civilization path: unlocks in {nextCivSpecialization.name}</p>
      {/if}

      {#if eraSpecs.length > 0}
        <div class="pt-4 mt-1 border-t border-ink/10">
          <h3 class="section-label mb-2">Era Specialization (choose one)</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {#each eraSpecs as spec (spec.id)}
              {@const isChosen = chosenSpec === spec.id}
              {@const isLocked = chosenSpec && !isChosen}
              <div
                class="item-card"
                class:purchased={isChosen}
                class:locked={isLocked}
              >
                <span class="block text-xs font-semibold text-ink mb-1">{spec.name}</span>
                <span class="block text-xs text-ink-muted mb-2 leading-tight">{spec.description}</span>
                <button
                  class="btn btn-sm w-full {getChoiceButtonClasses(isChosen, isLocked)}"
                  disabled={isChosen || isLocked}
                  onclick={() => chooseSpec(spec.id)}
                >
                  {isChosen ? '✓ Active' : isLocked ? 'Locked' : `Choose ${spec.name}`}
                </button>
              </div>
            {/each}
          </div>
        </div>
      {:else if chosenSpec}
        <p class="text-xs text-success pt-3">✓ Era specialization locked for the {formatEraName($gameStore.currentEra)}</p>
      {/if}
    </div>
  {/if}
</div>
