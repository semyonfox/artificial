<script>
  import { tick } from 'svelte';
  import { gameStore } from '../stores/gameStore.js';

  // cap the stack so a burst of events never floods the corner
  let focusedId = $state(null);
  let returnFocus;
  let visibleNotifications = $derived.by(() => {
    const recent = $gameStore.notifications.slice(0, 4);
    const focused = $gameStore.notifications.find(notif => notif.id === focusedId);
    return focused && !recent.includes(focused) ? [...recent.slice(0, 3), focused] : recent;
  });
  async function dismiss(id) {
    const hadFocus = focusedId === id;
    gameStore.dismissNotification(id);
    if (hadFocus) {
      focusedId = null;
      await tick();
      if (returnFocus?.isConnected) returnFocus.focus();
      else document.getElementById('actions')?.focus();
    }
  }

  function getNotificationClasses(type) {
    switch (type) {
      case 'success':
        return 'bg-success/90 border-success/50 text-surface-0';
      case 'error':
        return 'bg-danger/90 border-danger/50 text-surface-0';
      case 'warning':
        return 'bg-warning/90 border-warning/50 text-surface-0';
      case 'info':
      default:
        return 'bg-surface-3/95 border-accent/50 text-paper';
    }
  }
</script>

<div
  class="relative mb-4 sm:fixed sm:top-4 sm:right-4 z-50 flex flex-col gap-2 pointer-events-none sm:max-w-sm sm:w-[calc(100%-2rem)]"
  role="status"
  aria-live="polite"
  aria-atomic="false"
>
  {#each visibleNotifications as notif (notif.id)}
    <button
      type="button"
      class="relative px-4 py-3 rounded-lg shadow-xl shadow-black/30 border backdrop-blur-sm
             animate-slide-in pointer-events-auto cursor-pointer text-left
             transition-transform motion-safe:hover:scale-[1.02] {getNotificationClasses(notif.type)}"
      data-notification-id={notif.id}
      aria-label={`Dismiss notification: ${notif.message}`}
      onfocus={(event) => { focusedId = notif.id; if (event.relatedTarget && !event.relatedTarget.closest('[data-notification-id]')) returnFocus = event.relatedTarget; }}
      onblur={() => { focusedId = null; }}
      onclick={() => dismiss(notif.id)}
    >
      <p class="text-sm font-medium pr-4">{notif.message}</p>
      <span class="absolute top-1.5 right-2 text-xs opacity-60" aria-hidden="true">✕</span>
    </button>
  {/each}
</div>

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-slide-in {
      animation: none;
    }
  }
</style>
