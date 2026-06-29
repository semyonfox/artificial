<script>
  import { gameStore } from '../stores/gameStore.js';

  let visible = $state(true);

  function toggle() {
    visible = !visible;
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  function formatEffect(effect) {
    if (!effect) return '';
    return Object.entries(effect)
      .map(([resource, change]) => `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}% ${resource}`)
      .join(', ');
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h2 class="panel-title">Logs</h2>
    <button class="btn btn-ghost btn-sm" onclick={toggle}>
      {visible ? 'Hide' : 'Show'}
    </button>
  </div>

  {#if visible}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 class="section-label mb-2">Events</h3>
        <div class="max-h-48 overflow-y-auto rounded-lg bg-surface-2 border border-ink/10 p-3 space-y-3">
          {#if $gameStore.eventLog.length === 0}
            <p class="text-xs text-ink-muted">No events yet</p>
          {:else}
            {#each $gameStore.eventLog as event (event.timestamp)}
              <div class="pb-2 border-b border-ink/10 last:border-0 last:pb-0">
                <h4 class="text-sm font-semibold text-paper">{event.name}</h4>
                <p class="text-xs text-ink-muted mt-0.5">{event.description}</p>
                {#if event.effect}
                  <p class="text-[0.65rem] text-ink-soft mt-1">Effect: {formatEffect(event.effect)}</p>
                {/if}
                <span class="text-[0.6rem] text-ink-muted">{formatTime(event.timestamp)}</span>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div>
        <h3 class="section-label mb-2">Disasters</h3>
        <div class="max-h-48 overflow-y-auto rounded-lg bg-surface-2 border border-ink/10 p-3 space-y-3">
          {#if $gameStore.disasterLog.length === 0}
            <p class="text-xs text-ink-muted">No disasters yet</p>
          {:else}
            {#each $gameStore.disasterLog as disaster (disaster.timestamp)}
              <div class="pb-2 border-b border-ink/10 last:border-0 last:pb-0">
                <h4 class="text-sm font-semibold text-danger">{disaster.name}</h4>
                <p class="text-xs text-ink-muted mt-0.5">{disaster.description}</p>
                {#if disaster.effect}
                  <p class="text-[0.65rem] text-ink-soft mt-1">Effect: {formatEffect(disaster.effect)}</p>
                {/if}
                <span class="text-[0.6rem] text-ink-muted">{formatTime(disaster.timestamp)}</span>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
