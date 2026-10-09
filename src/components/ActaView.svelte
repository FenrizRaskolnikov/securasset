<script lang="ts">
  import { onMount } from 'svelte';
  import PocketBase from 'pocketbase';

  let { id }: { id: string } = $props();

  const pb = new PocketBase(typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : 'http://127.0.0.1:8090');

  let activo = $state<any>(null);
  let evalEndpoint = $state<any>(null);
  let auditoriaRed = $state<any>(null);
  let cargando = $state(true);

  onMount(async () => {
    try {
      activo = await pb.collection('activos').getOne(id);

      try {
        evalEndpoint = await pb.collection('evaluaciones_endpoints').getFirstListItem(`relation="${id}"`, { sort: '-created' });
      } catch (e) { evalEndpoint = null; }

      try {
        auditoriaRed = await pb.collection('evaluaciones_red').getFirstListItem(`relation="${id}"`, { sort: '-created' });
      } catch (e) { auditoriaRed = null; }

      cargando = false;

      // Esperar a que renderice la imagen del QR y lanzar la impresión
      setTimeout(() => {
        window.print();
      }, 600);
    } catch (err) {
      console.error('Error al cargar datos del acta:', err);
      cargando = false;
    }
  });

  let fechaHoy = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  let esPC = $derived(activo?.tipo === 'PC');
  let score = $derived(activo?.score_seguridad ?? activo?.score ?? 100);
  let esLinux = $derived(activo?.hostname?.toLowerCase().includes('kali') || activo?.tipo_so?.toLowerCase().includes('linux'));
  let nombreCifrado = $derived(esLinux ? 'LUKS' : 'BitLocker');
  let nSerie = $derived(activo?.n_serie || `SN-${(activo?.mac || '').replaceAll(':', '').toUpperCase()}`);
  let qrUrl = $derived(id ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(id)}` : '');

  let textoAdmins = $derived.by(() => {
    if (!evalEndpoint) return '-';
    if (evalEndpoint.admin_locales_lista) return `${evalEndpoint.admin_locales_lista}`;
    return evalEndpoint.admin_locales ? `${evalEndpoint.admin_locales}` : 'Ninguno';
  });
</script>

{#if cargando}
  <div style="padding: 40px; text-align: center; font-family: sans-serif; color: #333;">
    <p>Cargando información para generación de Acta PDF...</p>
  </div>
{:else if activo}
  <div class="acta-container">
    <div class="header-meta">
      Fecha: {fechaHoy} | ID: {activo.id} | Generado por Inventario-Seguridad SecurAsset
    </div>

    <div class="layout-grid">
      <div class="main-content">
        <h2 class="section-title">Ficha Técnica</h2>
        <table class="table-custom">
          <tbody>
            <tr>
              <td class="label-col">Hostname</td>
              <td><strong>{activo.hostname}</strong></td>
            </tr>
            <tr>
              <td class="label-col">Tipo</td>
              <td>{activo.tipo || 'PC'}</td>
            </tr>
            <tr>
              <td class="label-col">IP / MAC</td>
              <td>{activo.ip} / {activo.mac}</td>
            </tr>
            <tr>
              <td class="label-col">N° Serie</td>
              <td>{nSerie}</td>
            </tr>
            <tr>
              <td class="label-col">Ubicación</td>
              <td>{activo.ubicacion || 'Sede Central'}</td>
            </tr>
            <tr>
              <td class="label-col">Responsable</td>
              <td>{activo.responsable || 'Asignado Manualmente'}</td>
            </tr>
            <tr>
              <td class="label-col">Ciclo de vida</td>
              <td>{activo.estado_ciclo || 'Operativo'}</td>
            </tr>
            <tr>
              <td class="label-col">Score Seguridad</td>
              <td>
                <span class="badge-pill {score >= 80 ? 'badge-success' : score >= 50 ? 'badge-warning' : 'badge-danger'}">
                  {score}/100 {score >= 80 ? 'Óptimo' : score >= 50 ? 'Riesgo' : 'Crítico'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-title">Postura de Seguridad</h2>
        <table class="table-custom">
          <tbody>
            {#if esPC}
              <tr>
                <td class="label-col">{nombreCifrado}</td>
                <td>{evalEndpoint ? (evalEndpoint.bitlocker_activo ? 'ON' : 'OFF') : '-'}</td>
              </tr>
              <tr>
                <td class="label-col">EDR</td>
                <td>{evalEndpoint ? (evalEndpoint.edr_activo ? `Activo (${evalEndpoint.edr_version || 'Defender'})` : 'Inactivo') : '-'}</td>
              </tr>
              <tr>
                <td class="label-col">Parches SO</td>
                <td>{evalEndpoint ? (evalEndpoint.parches_so_al_dia ? 'Al día' : 'Pendientes') : '-'}</td>
              </tr>
              <tr>
                <td class="label-col">Admins locales</td>
                <td>{textoAdmins}</td>
              </tr>
            {:else}
              <tr>
                <td class="label-col">Password default</td>
                <td>{auditoriaRed?.password_default ? 'Riesgo (Default)' : (auditoriaRed ? 'Segura / Cambiada' : '-')}</td>
              </tr>
              <tr>
                <td class="label-col">Puertos abiertos</td>
                <td>{auditoriaRed?.puertos_abiertos || '-'}</td>
              </tr>
              <tr>
                <td class="label-col">Firmware</td>
                <td>{auditoriaRed?.firmware || '-'}</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

      <div class="sidebar">
        <div class="qr-box">
          <div class="qr-title">ETIQUETA QR — INVENTARIO FÍSICO</div>
          {#if qrUrl}
            <img class="qr-img" src={qrUrl} alt="Código QR" />
          {/if}
          <div class="qr-id">{activo.id}</div>
          <div class="qr-sub">{activo.hostname} • {nSerie}</div>
        </div>

        <div class="inmutable-box">
          <span class="inmutable-title">Acta inmutable</span> — ID trazable por QR. Verificar en dashboard SecurAsset.
        </div>
      </div>
    </div>

    <div class="footer-disclaimer">
      Se hace entrega/devolución del activo descrito bajo responsabilidad de <strong>{activo.responsable || 'Asignado Manualmente'}</strong> conforme a políticas de seguridad de Grupo Antumalal.
    </div>
  </div>
{:else}
  <div style="padding: 40px; text-align: center; color: red; font-family: sans-serif;">
    <p>No se encontró el activo solicitado ({id}).</p>
  </div>
{/if}

<style>
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
  :global(body) {
    background: #ffffff !important;
    color: #1e293b !important;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
  }
  .acta-container {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
  }
  .header-meta {
    font-size: 11px;
    color: #64748b;
    margin-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
  }
  .layout-grid {
    display: flex;
    gap: 20px;
  }
  .main-content {
    flex: 1;
  }
  .sidebar {
    width: 270px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 10px;
  }
  .table-custom {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 22px;
  }
  .table-custom td {
    border: 1px solid #e2e8f0;
    padding: 7px 10px;
    vertical-align: middle;
    font-size: 13px;
  }
  .table-custom tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .table-custom .label-col {
    width: 32%;
    color: #475569;
    font-weight: 500;
    background-color: #ffffff;
  }
  .badge-pill {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    color: #ffffff;
  }
  .badge-success { background-color: #1d7484; }
  .badge-warning { background-color: #d97706; }
  .badge-danger { background-color: #dc2626; }

  .qr-box {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
    background: #ffffff;
  }
  .qr-title {
    font-size: 11px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .qr-img {
    width: 140px;
    height: 140px;
    margin: 0 auto;
    display: block;
  }
  .qr-id {
    font-family: monospace;
    font-size: 11px;
    color: #64748b;
    margin-top: 8px;
  }
  .qr-sub {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }

  .inmutable-box {
    background: #f8fafc;
    border-left: 4px solid #f59e0b;
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 11px;
    color: #475569;
    line-height: 1.4;
  }
  .inmutable-title {
    font-weight: 700;
    color: #1e293b;
  }

  .footer-disclaimer {
    margin-top: 25px;
    font-size: 11px;
    color: #475569;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
  }

  @media print {
    .acta-container { padding: 0; }
  }
</style>