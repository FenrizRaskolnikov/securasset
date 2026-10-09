<script lang="ts">
  import PocketBase from 'pocketbase';

  let { 
    showEditModal = $bindable(false), 
    activo = $bindable(null), 
    closeEditModal,
    onGuardarExito 
  }: {
    showEditModal: boolean;
    activo: any;
    closeEditModal: () => void;
    onGuardarExito?: (msg: string) => void;
  } = $props();

  const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : '');
  const pb = new PocketBase(pbUrl);

  let hostname = $state('');
  let nSerie = $state('');
  let ip = $state('');
  let mac = $state('');
  let tipo = $state('PC');
  let estadoCiclo = $state('Operativo');
  let ubicacion = $state('');
  let responsable = $state('');
  let guardando = $state(false);

  $effect(() => {
    if (activo) {
      hostname = activo.hostname || '';
      nSerie = activo.n_serie || '';
      ip = activo.ip || '';
      mac = activo.mac || '';
      tipo = activo.tipo || 'PC';
      estadoCiclo = activo.estado_ciclo || 'Operativo';
      ubicacion = activo.ubicacion || 'Sede Central';
      responsable = activo.responsable || '';
    }
  });

  async function guardarCambios() {
    if (!activo?.id) return;
    guardando = true;
    try {
      const payload = {
        hostname,
        n_serie: nSerie,
        tipo,
        estado_ciclo: estadoCiclo,
        ubicacion,
        responsable
      };

      await pb.collection('activos').update(activo.id, payload);

      if (onGuardarExito) {
        onGuardarExito(`Activo ${hostname} actualizado correctamente`);
      }
      closeEditModal();
    } catch (err: any) {
      console.error("Error al actualizar activo:", err);
      alert("Error al guardar cambios: " + (err?.message || "Error de conexión"));
    } finally {
      guardando = false;
    }
  }
</script>

<div class="modal {showEditModal ? 'is-active' : ''}">
  <button type="button" class="modal-background" aria-label="Cerrar modal" onclick={closeEditModal}></button>

  {#if activo}
    <div class="modal-card modal-dark" style="width: 720px; max-width: 95vw;">
      <header class="modal-card-head header-custom">
        <p class="modal-card-title title is-5 has-text-white mb-0">
          Editar activo — {activo.hostname || 'S/N'}
        </p>
        <button class="delete" aria-label="close" onclick={closeEditModal}></button>
      </header>

      <section class="modal-card-body body-custom">
        <div class="columns is-multiline">
          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-hostname">Hostname *</label>
            <div class="control has-icons-left">
              <input id="edit-hostname" class="input is-small input-dark" type="text" bind:value={hostname} required />
              <span class="icon is-small is-left has-text-grey"><i class="fas fa-laptop"></i></span>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-nserie">N° Serie (RF-01)</label>
            <div class="control has-icons-left">
              <input id="edit-nserie" class="input is-small input-dark" type="text" bind:value={nSerie} />
              <span class="icon is-small is-left has-text-grey"><i class="fas fa-barcode"></i></span>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-ip">IP *</label>
            <div class="control has-icons-left">
              <input id="edit-ip" class="input is-small input-dark-disabled" type="text" value={ip} disabled readonly />
              <span class="icon is-small is-left has-text-grey"><i class="fas fa-network-wired"></i></span>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-mac">MAC *</label>
            <div class="control has-icons-left">
              <input id="edit-mac" class="input is-small input-dark-disabled" type="text" value={mac} disabled readonly />
              <span class="icon is-small is-left has-text-grey"><i class="fas fa-microchip"></i></span>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-tipo">Tipo *</label>
            <div class="control">
              <div class="select is-small is-fullwidth select-dark">
                <select id="edit-tipo" bind:value={tipo}>
                  <option value="PC">PC</option>
                  <option value="Servidor">Servidor</option>
                  <option value="NVR">NVR</option>
                </select>
              </div>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-estado">Estado ciclo *</label>
            <div class="control">
              <div class="select is-small is-fullwidth select-dark">
                <select id="edit-estado" bind:value={estadoCiclo}>
                  <option value="Operativo">Operativo</option>
                  <option value="Mantenimiento">En Mantenimiento</option>
                  <option value="Baja">Baja</option>
                  <option value="Cuarentena">Cuarentena</option>
                </select>
              </div>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-ubicacion">Ubicación *</label>
            <div class="control has-icons-left">
              <div class="select is-small is-fullwidth select-dark">
                <select id="edit-ubicacion" bind:value={ubicacion}>
                  <option value="Sede Central">Sede Central</option>
                  <option value="Sucursal Norte">Sucursal Norte</option>
                  <option value="Sucursal Sur">Sucursal Sur</option>
                  <option value="Bodega Central">Bodega Central</option>
                </select>
              </div>
              <span class="icon is-small is-left has-text-grey"><i class="fas fa-location-dot"></i></span>
            </div>
          </div>

          <div class="column is-6">
            <label class="label is-small has-text-grey-light" for="edit-responsable">Responsable</label>
            <div class="control has-icons-left">
              <input id="edit-responsable" class="input is-small input-dark" type="text" bind:value={responsable} />
              <span class="icon is-small is-left has-text-grey"><i class="fas fa-user"></i></span>
            </div>
          </div>
        </div>
      </section>

      <footer class="modal-card-foot footer-custom is-flex is-justify-content-space-between">
        <button class="button is-dark is-small" onclick={closeEditModal} disabled={guardando}>
          Cancelar
        </button>
        <button class="button is-warning is-small font-weight-bold" onclick={guardarCambios} class:is-loading={guardando}>
          <span class="icon"><i class="fas fa-save"></i></span>
          <span>Guardar cambios</span>
        </button>
      </footer>
    </div>
  {/if}
</div>

<style>
  .input-dark {
    background-color: #111827;
    border: 1px solid #374151;
    color: #f3f4f6;
  }
  .input-dark:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 0.125em rgba(59, 130, 246, 0.25);
  }
  .input-dark-disabled {
    background-color: #0f172a;
    border: 1px solid #1e293b;
    color: #9ca3af;
    cursor: not-allowed;
  }
  .select-dark select {
    background-color: #111827;
    border: 1px solid #374151;
    color: #f3f4f6;
  }
</style>