<script lang="ts">
  let { paginated, totalPages, currentPage, goPage, scoreClass, rowClass, openModal, pages } = $props();

  function estadoDotClass(estado: string) {
    switch (estado) {
      case 'Operativo': return 'dot-success';
      case 'Mantenimiento': return 'dot-warning';
      case 'Cuarentena': return 'dot-danger';
      case 'Baja': return 'dot-dark';
      default: return 'dot-success';
    }
  }
</script>

<div class="box p-0" style="overflow:hidden;">
  <div class="table-container">
    <table class="table is-fullwidth is-striped is-hoverable is-narrow mb-0">
      <thead>
        <tr class="is-size-7">
          <th>Dispositivo</th>
          <th>Tipo</th>
          <th class="is-hidden-mobile">IP</th>
          <th class="has-text-centered">Score</th>
          <th class="has-text-centered">Acción</th>
        </tr>
      </thead>
      <tbody>
        {#each paginated as a (a.id || a.ip)}
          <tr class="{rowClass(a.score_seguridad ?? a.score)} {a.isShadow?'has-text-grey-dark':''}">
            <td>
              <strong>{a.hostname}</strong> 
              {#if a.isShadow}
                <span class="tag has-background-grey-lighter has-text-grey-darker is-small ml-1" style="border:1px solid #b5b5b5"><i class="fas fa-user-secret mr-1"></i>Shadow IT</span>
              {:else if a.estado_ciclo}
                <span class="status-dot {estadoDotClass(a.estado_ciclo)} ml-2" title="Estado: {a.estado_ciclo}"></span>
              {/if}
              <br>
              <small class="has-text-grey is-size-7">{a.mac}</small>
            </td>
            <td>
              {#if a.isShadow}
                <span class="tag is-small has-background-grey has-text-white">Shadow IT</span>
              {:else}
                <span class="tag is-small
                {a.tipo === 'PC' ? 'is-light' : 
                a.tipo === 'NVR' ? 'is-warning is-dark' : 
                a.tipo === 'Servidor' ? 'is-info is-light' : 'has-background-light has-text-grey'}">
                {a.tipo}</span>
              {/if}
            </td>
            <td class="is-hidden-mobile is-family-monospace is-size-7">{a.ip}</td>
            <td class="has-text-centered">
              {#if a.isShadow}
                <span class="tag has-background-grey has-text-white">—</span>
              {:else}
                <span class="tag {scoreClass(a.score_seguridad ?? a.score)}">{a.score_seguridad ?? a.score}</span>
              {/if}
            </td>
            <td class="has-text-centered">
              <button class="button is-small {a.isShadow?'has-background-grey has-text-white':'is-info is-light'}" onclick={()=>openModal(a)}>Revisar</button>
            </td>
          </tr>
        {:else}
          <tr><td colspan="5" class="has-text-centered has-text-grey py-5">Sin resultados</td></tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
  <nav class="pagination is-small is-centered p-3" aria-label="pagination">
    <button class="pagination-previous" onclick={()=>goPage(currentPage - 1)} disabled={currentPage===1}>Anterior</button>
    <button class="pagination-next" onclick={()=>goPage(currentPage + 1)} disabled={currentPage===totalPages}>Siguiente</button>
    <ul class="pagination-list">
      {#each pages as p}
        <li><button class="pagination-link {currentPage===p?'is-current':''}" onclick={()=>goPage(p)}>{p}</button></li>
      {/each}
    </ul>
  </nav>
  {/if}
</div>

<style>
  .status-dot {
    height: 9px;
    width: 9px;
    border-radius: 50%;
    display: inline-block;
    vertical-align: middle;
    animation: pulse-glow 1.8s infinite;
  }

  .dot-success {
    background-color: #48c78e;
    box-shadow: 0 0 0 4px rgba(72, 199, 142, 0.25);
  }

  .dot-warning {
    background-color: #d97706;
    box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.25);
  }

  .dot-danger {
    background-color: #dc2626;
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.25);
  }

  .dot-dark {
    background-color: #334155;
    box-shadow: 0 0 0 4px rgba(51, 65, 85, 0.25);
  }
</style>