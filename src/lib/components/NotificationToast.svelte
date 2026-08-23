<script>
  import { gameStore } from '../stores/gameStore.js';

  // cap the stack so a burst of events never floods the corner
  let visibleNotifications = $derived($gameStore.notifications.slice(0, 4));

  function getNotificationClasses(type) {
    switch (type) {
      case 'success':
        return 'bg-success/90 border-success/50 text-surface-0';
      case 'error':
        return 'bg-danger/90 border-danger/50 text-white';
      case 'warning':
        return 'bg-warning/90 border-warning/50 text-surface-0';
      case 'info':
      default:
        return 'bg-surface-3/95 border-accent/50 text-paper';
    }
  }
</script>

<div
  class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm"
  role="status"
  aria-live="polite"
  aria-atomic="false"
>
  {#each visibleNotifications as notif (notif.id)}
    <button
      type="button"
      class="relative px-4 py-3 rounded-lg shadow-xl shadow-black/30 border backdrop-blur-sm
             animate-slide-in pointer-events-auto cursor-pointer text-left
             transition-transform hover:scale-[1.02] {getNotificationClasses(notif.type)}"
      title="Dismiss"
      onclick={() => gameStore.dismissNotification(notif.id)}
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
