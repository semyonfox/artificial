<script>
  import { gameStore } from '../stores/gameStore.js';

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

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
  {#each $gameStore.notifications as notif (notif.id)}
    <div
      class="px-4 py-3 rounded-lg shadow-xl shadow-black/30 border backdrop-blur-sm
             animate-slide-in pointer-events-auto {getNotificationClasses(notif.type)}"
    >
      <p class="text-sm font-medium">{notif.message}</p>
    </div>
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
</style>
