<script>
  // native dialog gives focus trapping, Escape and backdrop for free
  let { title, open = $bindable(false), children } = $props();
  let dialog;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  aria-labelledby={`${title}-dialog-title`}
  class="modal"
  onclose={() => (open = false)}
  onclick={(event) => { if (event.target === dialog) open = false; }}
>
  <div class="modal-header">
    <h2 id={`${title}-dialog-title`} class="panel-title">{title}</h2>
    <button class="btn btn-ghost btn-sm" aria-label={`Close ${title}`} onclick={() => (open = false)}>✕</button>
  </div>
  <div class="modal-body">
    {#if open}{@render children()}{/if}
  </div>
</dialog>
