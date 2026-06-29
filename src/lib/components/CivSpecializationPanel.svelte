<script>
  import { gameStore } from '../stores/gameStore.js';
  import { config } from '../../../js/core/config.js';
  import { getChoiceButtonClasses, getResourceIcon } from '../utils/gameFormatting.js';

  let currentEra = $derived($gameStore.currentEra);
  let civSpecs = $derived(config.civSpecializations?.[currentEra] || []);
  let chosenCiv = $derived($gameStore.civSpecializations?.[currentEra]);
  let currentEraIdx = $derived(config.eraOrder.indexOf(currentEra));

  let nextCivEra = $derived.by(() => {
    return config.eraOrder.find((eraKey) => {
      const eraIdx = config.eraOrder.indexOf(eraKey);
      return eraIdx > currentEraIdx && (config.civSpecializations?.[eraKey] || []).length > 0;
    });
  });

  function chooseCiv(civId) {
    $gameStore.gameManager?.chooseCivSpecialization(currentEra, civId);
    gameStore.refresh();
  }

</script>

<div class="space-y-3">
  <div>
    <h3 class="panel-title">Civilization Path</h3>
    <p class="text-xs text-ink-muted">Choose a civilization to specialize your production bonuses. This choice is permanent for this run.</p>
  </div>

  {#if civSpecs.length > 0}
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
            <h4 class="text-sm font-bold text-paper">{civ.name}</h4>
          </div>
          <p class="text-xs text-ink-muted mb-2">{civ.description}</p>

          <div class="text-[0.65rem] text-ink-muted mb-3">
            <span class="font-semibold">Bonuses:</span>
            {#each Object.entries(civ.bonuses || {}) as [resource, mult]}
              <span class="inline-block bg-paper/10 rounded px-1 mr-1">
                {getResourceIcon(resource)} ×{mult}
              </span>
            {/each}
          </div>

          {#if civ.historical}
            <p class="text-[0.6rem] text-ink-muted italic mb-2 line-clamp-2">{civ.historical}</p>
          {/if}

          <div class="mt-auto">
            <button
              class="btn btn-sm w-full {getChoiceButtonClasses(isChosen, isLocked)}"
              disabled={isChosen || isLocked}
              onclick={() => chooseCiv(civ.id)}
            >
              {isChosen ? '✓ Active' : isLocked ? 'Locked' : 'Choose Path'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="stat-box text-center">
      <p class="text-xs text-ink-muted">
        {#if nextCivEra}
          Civilization choices unlock in {config.eras[nextCivEra]?.name || nextCivEra}.
        {:else}
          No civilization choice is available in this era.
        {/if}
      </p>
    </div>
  {/if}
  </div>
