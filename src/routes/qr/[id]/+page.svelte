<script lang="ts">
  import PocketBase from 'pocketbase';
  import { generarActaPdf } from '../../../components/pdf-helper';

  let { data, params } = $props();

  const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : '');
  const pb = new PocketBase(pbUrl);

  let activoId = $derived(params.id);

  let activo = $state<any>(null);
  let auditoriaRed = $state<any>(null);
  let evalEndpoint = $state<any>(null);
  let cargando = $state(true);
  let errorMsg = $state('');

  $effect(() => {
    if (activoId) {
      cargando = true;
      errorMsg = '';

      pb.collection('activos')
        .getOne(activoId)
        .then((resActivo) => {
          activo = resActivo;

          const filtro = `relation="${activoId}" || host_asociado="${activo.hostname}" || ip_asociada="${activo.ip}"`;
          
          pb.collection('evaluaciones_red')
            .getFirstListItem(filtro, { sort: '-created' })
            .then((resRed) => (auditoriaRed = resRed))
            .catch(() => (auditoriaRed = null));

          pb.collection('evaluaciones_endpoints')
            .getFirstListItem(`relation="${activoId}"`, { sort: '-created' })
            .then((resEnd) => (evalEndpoint = resEnd))
            .catch(() => (evalEndpoint = null));
        })
        .catch((err) => {
          console.error(err);
          errorMsg = 'No se encontró el activo en la base de datos o el enlace es inválido.';
        })
        .finally(() => {
          cargando = false;
        });
    }
  });

  let scoreActual = $derived(activo?.score_seguridad ?? activo?.score ?? 100);
  let esPC = $derived((activo?.tipo || '').toUpperCase() === 'PC' || !activo?.tipo);
</script>

<svelte:head>
  <title>SecurAsset - Verificación de Activo</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<section class="section" style="min-height: 100vh; background-color: #0f172a; color: #f8fafc;">
  <div class="container" style="max-width: 600px;">
    
    <div class="has-text-centered mb-5">
      <h1 class="title is-4 has-text-white mb-1"><i class="fas fa-shield-alt has-text-warning mr-2"></i> SecurAsset</h1>
      <p class="subtitle is-6 has-text-grey-light">Verificación de Inventario Físico y Ciberseguridad</p>
    </div>

    {#if cargando}
      <div class="has-text-centered py-6">
        <span class="icon is-large has-text-warning"><i class="fas fa-spinner fa-spin fa-2x"></i></span>
        <p class="mt-3 has-text-grey-light">Cargando ficha del dispositivo...</p>
      </div>
    {:else if errorMsg}
      <div class="notification is-danger is-light">
        <p><i class="fas fa-exclamation-triangle mr-2"></i> {errorMsg}</p>
      </div>
    {:else if activo}
      <div class="box" style="background-color: #1e293b; border: 1px solid #334155; color: #f8fafc; border-radius: 8px;">
        
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-4 pb-3" style="border-bottom: 1px solid #334155;">
          <div>
            <h2 class="title is-5 has-text-white mb-1">{activo.hostname}</h2>
            <span class="tag {activo.tipo === 'NVR' ? 'is-warning is-dark' : 'is-info'} is-small mr-2">{activo.tipo}</span>
            <span class="tag {scoreActual >= 80 ? 'is-success' : scoreActual >= 50 ? 'is-warning' : 'is-danger'} is-small">
              {scoreActual} pts
            </span>
          </div>
        </div>

        <h3 class="subtitle is-6 has-text-info font-weight-bold mb-2">
          <i class="fas fa-server mr-1"></i> Ficha Técnica
        </h3>
        <table class="table is-fullwidth is-narrow" style="background: transparent; color: #e2e8f0; font-size: 13px;">
          <tbody>
            <tr>
              <td style="border-color: #334155;"><strong>IP / MAC</strong></td>
              <td style="border-color: #334155;"><span class="is-family-monospace">{activo.ip}</span><br><small class="has-text-grey">{activo.mac}</small></td>
            </tr>
            <tr>
              <td style="border-color: #334155;"><strong>N° Serie</strong></td>
              <td style="border-color: #334155;">{activo.n_serie || 'No registrado'}</td>
            </tr>
            <tr>
              <td style="border-color: #334155;"><strong>Ubicación</strong></td>
              <td style="border-color: #334155;">{activo.ubicacion || 'Sede Central'}</td>
            </tr>
            <tr>
              <td style="border-color: #334155;"><strong>Responsable</strong></td>
              <td style="border-color: #334155;">{activo.responsable || 'Sin asignar'}</td>
            </tr>
            <tr>
              <td style="border-color: #334155;"><strong>Ciclo de vida</strong></td>
              <td style="border-color: #334155;"><span class="tag is-small is-light">{activo.estado_ciclo || 'Operativo'}</span></td>
            </tr>
          </tbody>
        </table>

        <h3 class="subtitle is-6 has-text-info font-weight-bold mt-4 mb-2">
          <i class="fas fa-lock mr-1"></i> Postura de Seguridad
        </h3>
        <table class="table is-fullwidth is-narrow" style="background: transparent; color: #e2e8f0; font-size: 13px;">
          <tbody>
            {#if esPC}
              <tr>
                <td style="border-color: #334155;"><strong>BitLocker</strong></td>
                <td style="border-color: #334155;">
                  <span class="tag is-small {evalEndpoint?.bitlocker_activo ? 'is-success' : 'is-danger'}">
                    {evalEndpoint ? (evalEndpoint.bitlocker_activo ? 'Activado' : 'Desactivado / Riesgo') : 'Sin datos de agente'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="border-color: #334155;"><strong>EDR / Antivirus</strong></td>
                <td style="border-color: #334155;">
                  <span class="tag is-small {evalEndpoint?.edr_activo ? 'is-success' : 'is-danger'}">
                    {evalEndpoint ? (evalEndpoint.edr_activo ? 'Activo' : 'Inactivo') : 'Sin datos'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="border-color: #334155;"><strong>Parches SO</strong></td>
                <td style="border-color: #334155;">
                  {evalEndpoint ? (evalEndpoint.parches_so_al_dia ? 'Al día' : 'Pendientes') : '-'}
                </td>
              </tr>
            {:else}
              <tr>
                <td style="border-color: #334155;"><strong>Password Default</strong></td>
                <td style="border-color: #334155;">
                  <span class="tag is-small {auditoriaRed?.password_default ? 'is-danger' : 'is-success'}">
                    {auditoriaRed ? (auditoriaRed.password_default ? 'Riesgo (Default)' : 'Segura') : 'Sin auditar'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="border-color: #334155;"><strong>Puertos Abiertos</strong></td>
                <td style="border-color: #334155;">{auditoriaRed?.puertos_abiertos ? String(auditoriaRed.puertos_abiertos) : 'Ninguno detectado'}</td>
              </tr>
            {/if}
          </tbody>
        </table>

        <div class="has-text-centered mt-5">
          <button class="button is-warning is-fullwidth font-weight-bold" onclick={() => generarActaPdf(activo, 'entrega', evalEndpoint, auditoriaRed)}>
            <span class="icon"><i class="fas fa-file-pdf"></i></span>
            <span>Generar / Ver Acta PDF</span>
          </button>
        </div>

      </div>
    {/if}

  </div>
</section>