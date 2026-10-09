<script lang="ts">
  let { activosValidos, shadowFormateados, stats, openModal } = $props();
</script>

<div class="columns is-multiline mb-2">
  <!-- Tarjeta Roja: Críticos -->
  <div class="column is-4">
    <article class="message is-danger is-small mb-3">
      <div class="message-header">
        <p><i class="fas fa-exclamation-triangle mr-1"></i> Crítico (&lt;50)</p>
        <span class="tag is-danger is-light">{stats.criticos}</span>
      </div>
      <div class="message-body p-3" style="min-height: 140px;">
        {#each activosValidos.filter((a: any)=>!a.isShadow && (a.score_seguridad ?? a.score)!=null && (a.score_seguridad ?? a.score)<50).slice(0,3) as a}
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
            <div>
              <strong>{a.hostname}</strong><br>
              <small class="has-text-grey">({a.ip})</small>
            </div>
            <button class="button is-small is-danger is-light" onclick={()=>openModal(a)}>Revisar</button>
          </div>
        {/each}
        {#if stats.criticos===0}<p class="has-text-grey">Sin equipos críticos.</p>{/if}
      </div>
    </article>
  </div>

  <!-- Tarjeta Amarilla: Medio / Advertencia -->
  <div class="column is-4">
    <article class="message is-warning is-small mb-3">
      <div class="message-header">
        <p><i class="fas fa-exclamation-circle mr-1"></i> Medio (50 - 79)</p>
        <span class="tag is-warning is-light">{activosValidos.filter((a: any)=>!a.isShadow && (a.score_seguridad ?? a.score)!=null && (a.score_seguridad ?? a.score)>=50 && (a.score_seguridad ?? a.score)<80).length}</span>
      </div>
      <div class="message-body p-3" style="min-height: 140px;">
        {#each activosValidos.filter((a: any)=>!a.isShadow && (a.score_seguridad ?? a.score)!=null && (a.score_seguridad ?? a.score)>=50 && (a.score_seguridad ?? a.score)<80).slice(0,3) as a}
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
            <div>
              <strong>{a.hostname}</strong><br>
              <small class="has-text-grey">({a.ip})</small>
            </div>
            <button class="button is-small is-warning is-light" onclick={()=>openModal(a)}>Revisar</button>
          </div>
        {/each}
        {#if activosValidos.filter((a: any)=>!a.isShadow && (a.score_seguridad ?? a.score)!=null && (a.score_seguridad ?? a.score)>=50 && (a.score_seguridad ?? a.score)<80).length===0}
          <p class="has-text-grey">Sin equipos en riesgo medio.</p>
        {/if}
      </div>
    </article>
  </div>

  <!-- Tarjeta Gris: Shadow IT / Cuarentena -->
  <div class="column is-4">
    <article class="message is-small" style="border-color:#b5b5b5">
      <div class="message-header has-background-grey has-text-white">
        <p><i class="fas fa-user-secret mr-1"></i> Shadow IT</p>
        <span class="tag has-background-grey-dark has-text-white">{shadowFormateados.length}</span>
      </div>
      <div class="message-body has-background-grey-lighter p-3" style="border-color:#dbdbdb; min-height: 140px;">
        {#if shadowFormateados.length>0}
          {#each shadowFormateados.slice(0,3) as a}
            <div class="box is-shadowless has-background-white p-2 mb-2 is-size-7" style="border:1px solid #dbdbdb">
              <div class="is-flex is-justify-content-space-between is-align-items-center">
                <div>
                  <strong>{a.ip}</strong><br>
                  <span class="has-text-grey font-monospace is-size-7">({a.mac})</span>
                </div>
                <!-- Botón de revisión -->
                <button class="button is-small has-background-grey has-text-white" onclick={()=>openModal(a)}>
                  Revisar
                </button>
              </div>
            </div>
          {/each}
        {:else}
          <p class="has-text-grey">No hay Shadow IT pendiente.</p>
        {/if}
      </div>
    </article>
  </div>
</div>