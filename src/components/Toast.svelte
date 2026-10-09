<script lang="ts">
  let { toast } = $props();
</script>

{#if toast.show}
  <div class="notification {toast.type} is-light" style="position:fixed; bottom:20px; right:20px; z-index:99; max-width:340px;">
    <button class="delete" aria-label="Cerrar" onclick={() => toast.show = false}></button>
    {toast.message}
  </div>
{/if}