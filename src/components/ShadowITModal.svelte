<script lang="ts">
  import type { DispositivoShadowIT } from '../lib/types';

  let { 
    dispositivo = $bindable<any | null>(), 
    onGuardar, 
    onCerrar 
  }: { 
    dispositivo: any | null; 
    onGuardar?: (actualizado: any) => void; 
    onCerrar: () => void; 
  } = $props();

  let estadoLocal = $state<any | null>(null);

  $effect(() => {
    if (dispositivo) {
      estadoLocal = { ...dispositivo };
    } else {
      estadoLocal = null;
    }
  });

  let score = $derived(estadoLocal?.scoreSeguridad ?? estadoLocal?.score_seguridad ?? 0);
  let estadoModal = $derived(estadoLocal?.estadoShadow ?? estadoLocal?.estado_ciclo ?? 'Detectado');

  let claseRiesgo = $derived.by(() => {
    if (score < 50) return 'is-danger';
    if (score < 75) return 'is-warning';
    return 'is-success';
  });

  let puertos = $derived.by(() => {
    const p = estadoLocal?.puertosAbiertos ?? estadoLocal?.puertos_abiertos;
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (typeof p === 'string') {
      try {
        const parsed = JSON.parse(p);
        return Array.isArray(parsed) ? parsed : [p];
      } catch (e) {
        return p.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  });

  let vulnerabilidades = $derived.by(() => {
    const v = estadoLocal?.vulnerabilidades;
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  function guardarCambios() {
    if (estadoLocal && onGuardar) {
      onGuardar(estadoLocal);
    }
    cerrar();
  }

  function cerrar() {
    dispositivo = null;
    onCerrar();
  }

  function imprimirActa() {
    window.print();
  }
</script>

{#if estadoLocal}
  <div class="modal is-active">
    <div 
      class="modal-background" 
      onclick={cerrar} 
      role="button" 
      tabindex="0" 
      onkeydown={(e) => e.key === 'Escape' && cerrar()}
    ></div>
    
    <div class="modal-card modal-width">
      <header class="modal-card-head">
        <p class="modal-card-title">
          <span class="icon-text">
            <span>Dispositivo Shadow IT: {estadoLocal.hostname || estadoLocal.ip}</span>
          </span>
        </p>
        <button class="delete" aria-label="close" onclick={cerrar}></button>
      </header>

      <section class="modal-card-body">
        <div class="columns is-multiline">
          <div class="column is-6">
            <p><strong>Dirección IP:</strong> {estadoLocal.ip || estadoLocal.ip_detectada}</p>
            <p><strong>Dirección MAC:</strong> {estadoLocal.mac || estadoLocal.mac_detectada}</p>
            <p><strong>Sistema Operativo:</strong> {estadoLocal.sistemaOperativo || 'Desconocido'}</p>
            <p><strong>Tipo:</strong> {estadoLocal.tipoDispositivo || estadoLocal.tipo || 'Shadow IT'}</p>
          </div>

          <div class="column is-6">
            <div class="field">
              <p class="label">Score de Seguridad</p>
              <span class="tag is-large {claseRiesgo}">
                {score} / 100
              </span>
            </div>

            <div class="field">
              <label class="label" for="estado-select">Estado de Clasificación</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select id="estado-select" bind:value={estadoLocal.estado_ciclo}>
                    <option value="Detectado">Detectado (Pendiente)</option>
                    <option value="En Cuarentena">En Cuarentena</option>
                    <option value="Aprobado">Aprobado / Inventariado</option>
                    <option value="No Autorizado">No Autorizado / Bloqueado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div class="content">
          <h4>Puertos Detectados</h4>
          {#if puertos.length > 0}
            <div class="tags">
              {#each puertos as puerto}
                <span class="tag is-info is-light">Puerto {puerto}</span>
              {/each}
            </div>
          {:else}
            <p class="has-text-grey">No se detectaron puertos abiertos en el escaneo rápido.</p>
          {/if}
        </div>

        <div class="content">
          <h4>Vulnerabilidades / Alertas ({vulnerabilidades.length})</h4>
          {#if vulnerabilidades.length > 0}
            <div class="table-container">
              <table class="table is-fullwidth is-striped is-narrow">
                <thead>
                  <tr>
                    <th>CVE / Código</th>
                    <th>Severidad</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {#each vulnerabilidades as vuln}
                    <tr>
                      <td><code>{vuln.cve || 'N/A'}</code></td>
                      <td>
                        <span class="tag {vuln.severidad === 'Crítica' ? 'is-danger' : vuln.severidad === 'Alta' ? 'is-warning' : 'is-info'}">
                          {vuln.severidad || 'Media'}
                        </span>
                      </td>
                      <td>{vuln.descripcion || vuln}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="has-text-success">No se registraron vulnerabilidades críticas.</p>
          {/if}
        </div>
      </section>

      <footer class="modal-card-foot is-justify-content-space-between">
        <div>
          <button class="button is-light" onclick={imprimirActa}>
            🖨️ Imprimir Acta
          </button>
        </div>
        <div>
          <button class="button" onclick={cerrar}>Cancelar</button>
          <button class="button is-link" onclick={guardarCambios}>Guardar Cambios</button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-width {
    width: 100%;
    max-width: 800px;
  }
</style>