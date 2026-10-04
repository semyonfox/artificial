<script>
  import { gameStore } from '../stores/gameStore.js';
  import { config } from '../../../js/core/config.js';
  import {
    formatNumber,
    formatResourceName,
    getEraProgressPercent,
    getResourceIcon,
  } from '../utils/gameFormatting.js';

  let eraData = $derived($gameStore.currentEraData);
  let canAdvance = $derived($gameStore.canAdvance);
  let totalClicks = $derived($gameStore.progression?.totalClicks || 0);
  let unlockedAchievements = $derived(($gameStore.achievements || []).filter(ach => ach.unlocked).length);
  let totalAchievements = $derived(($gameStore.achievements || []).length);
  let nextEra = $derived($gameStore.nextEra);

  let progressPercent = $derived.by(() => {
    return getEraProgressPercent(eraData?.advancementCost, $gameStore.resources);
  });

  let requirements = $derived($gameStore.advancementRequirements);

  // furthest-behind incomplete requirement gets visual focus
  let bottleneckResource = $derived.by(() => {
    const incomplete = requirements.filter(req => !req.complete);
    if (incomplete.length === 0) return null;
    return [...incomplete].sort(
      (a, b) => (a.current / a.required) - (b.current / b.required),
    )[0].resource;
  });

  let populationView = $derived($gameStore.populationView);
  let populationRequirement = $derived(requirements.find(req => req.resource === 'population'));

  let nextStep = $derived.by(() => {
    if (canAdvance && nextEra) return `Ready to advance. Use Advance to ${nextEra.name} below; materials are spent and population stays.`;
    if ($gameStore.currentEra !== 'paleolithic') return null;
    if (!$gameStore.upgrades.stoneKnapping) return 'Forage for sticks and occasional stones. Buy Stone Knapping in Upgrades to unlock Hunt.';
    if (!$gameStore.upgrades.fireControl) return 'Hunt for Meat to support population. Buy Fire Control in Upgrades to unlock Cook.';
    return 'Hunt for Meat, then Cook for Cooked Meat. Both support your population; keep the stocks listed below to advance.';
  });

  let populationDiagnosis = $derived.by(() => {
    if (!populationRequirement || populationRequirement.complete) return null;
    const growthCfg = config.balance?.populationGrowth || {};
    const { pop, cap, loadRatio, supportAvailable, supportResources } = populationView;
    if (pop >= cap) return { blocked: true, message: 'At the era population cap. Advance to raise it.' };
    const messages = [];
    const loadCap = growthCfg.workerLoadSoftCap || 0.65;
    if (loadRatio > loadCap) messages.push('Most people are assigned to work, slowing growth. Wait for more people before hiring again.');
    if (supportAvailable < Math.max(1, pop * (growthCfg.foodBufferPerCapita || 0.6))) {
      messages.push(`Low support reserves slow growth. Build a reserve of ${supportResources.map(formatResourceName).join(' or ')}.`);
    }
    return { blocked: messages.length > 0, message: messages.join(' ') || 'Growing steadily.' };
  });

  function advanceEra() {
    if (gameStore.advanceEra()) document.getElementById("objective-title")?.focus();
  }
</script>

<section class="space-y-4">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div class="min-w-0">
      <p class="section-label mb-1">Current Objective</p>
      <h2 id="objective-title" tabindex="-1" class="text-xl font-bold text-paper">
        {#if nextEra}
          Reach {nextEra.name}
        {:else}
          Final era reached
        {/if}
      </h2>
      <p class="text-sm text-ink-muted mt-1">
        {eraData?.name || 'Paleolithic Era'} progress: {progressPercent.toFixed(1)}%
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2 shrink-0 sm:grid-cols-3">
      <div class="stat-box">
        <p class="section-label">Actions</p>
        <p class="text-lg font-bold text-paper tabular-nums">{formatNumber(totalClicks)}</p>
      </div>
      <div class="stat-box">
        <p class="section-label">Achievements</p>
        <p class="text-lg font-bold text-paper tabular-nums">{unlockedAchievements}/{totalAchievements}</p>
      </div>
      <div class="stat-box col-span-2 sm:col-span-1">
        <p class="section-label">Era</p>
        <p class="text-lg font-bold text-paper tabular-nums">{$gameStore.eraNumber}/{$gameStore.eraCount}</p>
      </div>
    </div>
  </div>

  <div>
    <div
      class="progress-bar"
      role="progressbar"
      aria-label="Era advancement progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(progressPercent)}
    >
      <div class="progress-fill" style="width: {progressPercent.toFixed(1)}%"></div>
    </div>
  </div>

  {#if nextStep}
    <p class="rounded-lg bg-accent/10 border border-accent/30 p-3 text-sm text-ink-soft leading-relaxed"><strong class="text-paper">Next step:</strong> {nextStep}</p>
  {/if}
  <p class="text-sm text-ink-muted leading-relaxed">Population grows over time; support reserves speed it up. Hiring assigns an existing person. You have {$gameStore.availablePopulation} available people and {populationView.totalWorkers} assigned workers.</p>
  {#if requirements.length > 0}
    <p class="text-sm text-ink-muted">Requirements use current stocks, so spending can lower this progress. Advancing spends the listed materials; population stays.</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {#each requirements as req (req.resource)}
        {@const isBottleneck = req.resource === bottleneckResource}
        <div
          class="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors
            {req.complete
              ? 'bg-success/5 border-success/30'
              : isBottleneck
                ? 'bg-surface-2 border-accent/50 ring-1 ring-accent/30 sm:col-span-2'
                : 'bg-surface-2/70 border-ink/10'}"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-7 h-7 flex items-center justify-center rounded-md bg-ink/5 border border-ink/10 text-sm shrink-0">
              {getResourceIcon(req.resource, '?')}
            </span>
            {#if isBottleneck}
              <span class="text-xs font-bold uppercase tracking-wide text-accent shrink-0">Focus</span>
            {/if}
            <span class="text-sm text-ink-soft min-w-0 break-words" title={formatResourceName(req.resource)}>{formatResourceName(req.resource)}</span>
          </div>
          <span
            class="text-sm font-semibold tabular-nums whitespace-nowrap shrink-0"
            class:text-success={req.complete}
            class:text-paper={isBottleneck}
            class:text-ink-muted={!req.complete && !isBottleneck}
          >
            {req.complete ? "✓ " : ""}{formatNumber(req.current)} / {formatNumber(req.required)}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  {#if populationDiagnosis}
    <p
      class="text-sm leading-relaxed {populationDiagnosis.blocked ? 'text-warning' : 'text-success'}"

    >
      {populationDiagnosis.blocked ? '⚠' : '✓'}
      Population: {populationDiagnosis.message}
    </p>
  {/if}

  <div class="flex justify-end">
    <button
      class="btn"
      class:btn-primary={canAdvance}
      class:btn-secondary={!canAdvance}
      disabled={!canAdvance}
      onclick={advanceEra}
    >
      {canAdvance && nextEra ? `Advance to ${nextEra.name}` : 'Requirements not met'}
    </button>
  </div>
</section>
