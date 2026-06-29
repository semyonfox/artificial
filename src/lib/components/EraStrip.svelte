<script>
  import { gameStore } from '../stores/gameStore.js';
  import { config } from '../../../js/core/config.js';
  import { getEraProgressPercent } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.gameManager?.getCurrentEraData());

  let progressPercent = $derived.by(() => {
    return getEraProgressPercent(eraData?.advancementCost, $gameStore.resources);
  });

  let canAdvance = $derived($gameStore.gameState?.canAdvanceEra() ?? false);
  let currentIdx = $derived(config.eraOrder.indexOf($gameStore.currentEra));
  let highestEra = $derived($gameStore.prestige?.highestEra || $gameStore.currentEra);

  let highestIdx = $derived.by(() => {
    const bestIdx = config.eraOrder.indexOf(highestEra);
    return Math.max(currentIdx, bestIdx >= 0 ? bestIdx : 0);
  });

  let timeline = $derived.by(() => {
    const revealThrough = Math.min(config.eraOrder.length - 1, Math.max(currentIdx, highestIdx) + 1);
    return config.eraOrder.slice(0, revealThrough + 1).map((eraKey, index) => {
      const info = config.eras?.[eraKey] || config.eraData?.[eraKey] || {};
      const unlocked = index <= highestIdx;
      return {
        key: eraKey,
        index,
        unlocked,
        current: index === currentIdx,
        best: index === highestIdx && highestIdx !== currentIdx,
        name: unlocked ? (info.name || eraKey) : '?',
        shortName: unlocked ? getShortName(info.name || eraKey) : '?',
        timespan: unlocked ? info.timespan : '',
      };
    });
  });

  let timelineMinWidth = $derived.by(() => {
    return `${Math.max(320, timeline.length * 88)}px`;
  });

  function advanceEra() {
    $gameStore.gameManager?.advanceEra();
  }

  function getShortName(name) {
    return name
      .replace('Age of ', '')
      .replace(' Era', '')
      .replace('Age', '')
      .trim();
  }
</script>

<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
  <div class="flex items-center gap-4 min-w-0 lg:w-64">
    <div class="flex flex-col min-w-0">
      <span class="text-[0.6rem] font-bold uppercase tracking-widest text-ink-muted">Era</span>
      <strong class="text-sm font-semibold text-ink truncate">{eraData?.name || 'Paleolithic Era'}</strong>
    </div>

    <div class="flex-1 min-w-[96px]">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progressPercent.toFixed(1)}%"></div>
      </div>
    </div>
  </div>

  <div class="relative min-w-0 overflow-x-auto pb-1 lg:flex-1">
    <div
      class="relative grid items-start px-1 pt-1"
      style={`grid-template-columns: repeat(${timeline.length}, minmax(72px, 1fr)); min-width: ${timelineMinWidth};`}
    >
      <div class="absolute left-5 right-5 top-4 h-px bg-ink/15"></div>

      {#each timeline as era (era.key)}
        <div class="relative z-10 flex min-w-0 flex-col items-center gap-1">
          <div
            class={`relative flex h-7 w-7 items-center justify-center rounded-full border text-[0.65rem] font-bold transition-colors ${
              era.current
                ? 'bg-success text-surface-0 border-success'
                : era.unlocked
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-surface-3 text-ink-muted border-ink/15'
            }`}
            title={era.unlocked ? `${era.name}${era.timespan ? ` (${era.timespan})` : ''}` : 'Unknown era'}
          >
            {#if era.best}
              <span class="absolute -inset-1 rounded-full border border-paper/30 bg-paper/5"></span>
            {/if}
            <span class="relative">{era.unlocked ? era.index + 1 : '?'}</span>
          </div>

          <span
            class={`max-w-20 truncate text-center text-[0.65rem] font-semibold leading-tight ${
              era.current ? 'text-paper' : era.unlocked ? 'text-ink-soft' : 'text-ink-muted'
            }`}
            title={era.name}
          >
            {era.shortName}
          </span>
        </div>
      {/each}
    </div>
  </div>

  {#if canAdvance}
    <button class="btn btn-primary btn-sm whitespace-nowrap" onclick={advanceEra}>
      Advance Era
    </button>
  {/if}
</div>
