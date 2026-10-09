<script lang="ts">
  import PocketBase from 'pocketbase';
  import { generarActaPdf } from './pdf-helper';

  let { 
    showModal = $bindable(), 
    modalActivo, 
    closeModal,
    onSolicitarRescaneo,
    onAbrirEditar
  }: {
    showModal: boolean;
    modalActivo: any;
    closeModal: () => void;
    onSolicitarRescaneo?: (activo: any) => void;
    onAbrirEditar?: (activo: any) => void;
  } = $props();

  const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : '');
  const pb = new PocketBase(pbUrl);

  let esAdmin = $derived(pb.authStore.model?.role === 'admin' || pb.authStore.model?.es_admin === true);

  let activoLocal = $state<any>(null);
  let auditoriaRed = $state<any>(null);
  let cargando = $state(false);
  let escaneando = $state(false);
  let tiempoInicioEscaneo = 0;
  let timeoutRespaldo: any = null;

  async function solicitarReescaneo() {
    if (!activoLocal?.id) return;
    escaneando = true;
    tiempoInicioEscaneo = Date.now();

    if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
    timeoutRespaldo = setTimeout(() => {
      escaneando = false;
    }, 25000);

    try {
      await pb.collection('activos').update(activoLocal.id, {
        forzar_escaneo_manual: true
      });
      if (onSolicitarRescaneo) {
        onSolicitarRescaneo(activoLocal);
      }
    } catch (err) {
      console.error('Error al solicitar re-escaneo:', err);
      escaneando = false;
      if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
    }
  }

  $effect(() => {
    if (!modalActivo?.id) {
      activoLocal = null;
      auditoriaRed = null;
      escaneando = false;
      if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
      return;
    }

    activoLocal = modalActivo;
    cargando = true;

    const filtro = `relation="${modalActivo.id}" || host_asociado="${modalActivo.hostname}" || ip_asociada="${modalActivo.ip}"`;
    
    pb.collection('evaluaciones_red')
      .getFirstListItem(filtro, { sort: '-created' })
      .then((res) => { auditoriaRed = res; })
      .catch(() => { auditoriaRed = null; })
      .finally(() => (cargando = false));

    let unsubActivo: (() => void) | undefined;
    pb.collection('activos').subscribe(modalActivo.id, (e) => {
      if (e.action === 'update') {
        activoLocal = e.record;
      }
    }).then((unsub) => { unsubActivo = unsub; });

    let unsubEvalRed: (() => void) | undefined;
    pb.collection('evaluaciones_red').subscribe('*', (e) => {
      if (e.record.relation === modalActivo.id || e.record.host_asociado === modalActivo.hostname || e.record.ip_asociada === modalActivo.ip) {
        auditoriaRed = e.record;
        
        if (escaneando) {
          const fechaEval = new Date(e.record.created || e.record.updated).getTime();
          if (fechaEval >= tiempoInicioEscaneo - 2000) {
            escaneando = false;
            if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
          }
        }
      }
    }).then((unsub) => { unsubEvalRed = unsub; });

    return () => {
      if (unsubActivo) unsubActivo();
      if (unsubEvalRed) unsubEvalRed();
      if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
      pb.collection('activos').unsubscribe(modalActivo.id);
      pb.collection('evaluaciones_red').unsubscribe('*');
    };
  });

  let listaPuertos = $derived.by(() => {
    const raw = auditoriaRed?.puertos_abiertos;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof raw === 'string' ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  });

  let listaVulns = $derived.by(() => {
    const raw = auditoriaRed?.vulnerabilidades;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [raw];
    }
  });

  let esPasswordDefault = $derived.by(() => {
    if (!auditoriaRed) return false;
    const boolDirecto = Boolean(auditoriaRed.password_default);
    const enVulnerabilidades = listaVulns.some((v: any) =>
      typeof v === 'string' && v.toLowerCase().includes('contraseña por defecto')
    );
    return boolDirecto || enVulnerabilidades;
  });

  function infoPuerto(puerto: string) {
    const p = String(puerto).trim();
    switch (p) {
      case '22': return { nombre: 'SSH (22)', tagClass: 'is-info' };
      case '23': return { nombre: 'Telnet (23)', tagClass: 'is-danger' };
      case '80': return { nombre: 'HTTP (80)', tagClass: 'is-warning' };
      case '443': return { nombre: 'HTTPS (443)', tagClass: 'is-success' };
      case '554': return { nombre: 'RTSP Video (554)', tagClass: 'is-warning' };
      case '3389': case '13389': return { nombre: `RDP (${p})`, tagClass: 'is-danger' };
      default: return { nombre: `Puerto ${p}`, tagClass: 'is-dark' };
    }
  }

  let listaAlertas = $derived.by(() => {
    const alertas: string[] = [];
    if (auditoriaRed?.estado_conexion === 'Offline') alertas.push('Dispositivo fuera de línea / inalcanzable en el último escaneo');
    if (esPasswordDefault) alertas.push('Contraseña por defecto de fábrica detectada vía HTTP');
    if (listaPuertos.includes('23')) alertas.push('Protocolo inseguro Telnet (puerto 23) expuesto en la red');
    if (activoLocal?.tipo === 'NVR' && listaPuertos.includes('22')) alertas.push('Puerto SSH (22) abierto en grabador NVR (Riesgo potencial)');
    if (listaVulns.length > 0) {
      listaVulns.forEach((v: any) => {
        const esAlertaPass = typeof v === 'string' && v.toLowerCase().includes('contraseña por defecto');
        if (!esAlertaPass && v && v !== 'Sin vulnerabilidades críticas detectadas' && !alertas.includes(v)) {
          alertas.push(typeof v === 'string' ? v : JSON.stringify(v));
        }
      });
    }
    return alertas;
  });

  function formatearFecha(fechaStr: string | null) {
    if (!fechaStr) return 'Pendiente / En proceso';
    try {
      return new Date(fechaStr).toLocaleString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return fechaStr;
    }
  }

  let scoreActual = $derived(activoLocal?.score_seguridad ?? activoLocal?.score ?? 100);

  let qrUrl = $derived.by(() => {
    if (!activoLocal?.id) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}?ver=${activoLocal.id}`)}`;
  });

  function imprimirQrIndividual() {
    if (!activoLocal) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const targetUrl = `${baseUrl}?ver=${activoLocal.id}`;
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;
    const ventana = window.open('', '_blank', 'width=450,height=550');
    if (!ventana) return;
    ventana.document.write(`
        <!doctype html><html><head><meta charset="utf-8"><title>QR - ${activoLocal.hostname}</title>
        <style>@page{size:80mm 100mm;margin:5mm;}body{font-family:sans-serif;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a;}.etiqueta{width:240px;border:2px dashed #64748b;border-radius:12px;padding:16px;background:#fff;}h3{margin:0 0 2px;font-size:18px;font-weight:800;}p{margin:2px 0 12px;font-size:13px;color:#475569;}img{width:170px;height:170px;display:block;margin:0 auto;}.id-code{font-family:monospace;font-size:12px;margin-top:10px;font-weight:bold;}.no-print{margin-top:20px;}button{background:#0f172a;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;}@media print{body{background:#fff;min-height:auto;}.etiqueta{border:2px dashed #000;box-shadow:none;width:100%;}.no-print{display:none;}}</style>
        </head><body><div class="etiqueta"><h3>SecurAsset</h3><p>${activoLocal.hostname} (${activoLocal.tipo || 'PC'})</p><img src="${qrImage}" /><div class="id-code">${activoLocal.id}</div></div><div class="no-print"><button onclick="window.print()">Imprimir Etiqueta</button></div></body></html>
    `);
    ventana.document.close();
  }
</script>

<div class="modal {showModal ? 'is-active' : ''}">
  <button type="button" class="modal-background" aria-label="Cerrar modal" onclick={closeModal}></button>
  {#if activoLocal}
    <div class="modal-card modal-dark" style="width: 850px; max-width: 95vw;">
      <header class="modal-card-head header-custom">
        <div class="is-flex is-align-items-center">
          <span class="title is-4 has-text-white mb-0 mr-3">{activoLocal.hostname}</span>
          <span class="tag {activoLocal.tipo === 'NVR' ? 'is-warning is-dark' : 'is-info'} mr-2">{activoLocal.tipo}</span>
          <span class="tag {scoreActual >= 80 ? 'is-success' : scoreActual >= 50 ? 'is-warning' : 'is-danger'} is-medium">{scoreActual} pts</span>
          {#if auditoriaRed}
            <span class="tag {auditoriaRed.estado_conexion === 'Offline' ? 'is-danger' : 'is-success'} is-light ml-2">
              <i class="fas fa-circle mr-1 is-size-7"></i> {auditoriaRed.estado_conexion || 'Online'}
            </span>
          {/if}
        </div>
        <button class="delete is-large" aria-label="close" onclick={closeModal}></button>
      </header>
      <section class="modal-card-body body-custom">
        {#if listaAlertas.length > 0}
          <article class="message is-danger is-small mb-4">
            <div class="message-header py-1"><p><i class="fas fa-shield-cat mr-1"></i> Vulnerabilidades y Alertas de Red Detectadas</p></div>
            <div class="message-body py-2">
              <ul style="list-style-type: disc; padding-left: 20px;">
                {#each listaAlertas as alerta}<li>{alerta}</li>{/each}
              </ul>
            </div>
          </article>
        {/if}
        <div class="columns is-multiline">
          <div class="column is-6">
            <h3 class="subtitle is-6 has-text-info font-weight-bold mb-2"><i class="fas fa-server mr-1"></i> Ficha Técnica del Activo</h3>
            <table class="table is-fullwidth table-dark-custom is-narrow">
              <tbody>
                <tr><td><strong>Hostname</strong></td><td>{activoLocal.hostname}</td></tr>
                <tr><td><strong>Tipo</strong></td><td><span class="tag is-small is-light">{activoLocal.tipo}</span></td></tr>
                <tr><td><strong>IP</strong></td><td><span class="is-family-monospace">{activoLocal.ip}</span></td></tr>
                <tr><td><strong>MAC</strong></td><td><span class="is-family-monospace">{activoLocal.mac}</span></td></tr>
                <tr><td><strong>N° Serie</strong></td><td>{activoLocal.n_serie || 'No registrado'}</td></tr>
                <tr><td><strong>Ubicación</strong></td><td>{activoLocal.ubicacion || 'Sede Central'}</td></tr>
                <tr><td><strong>Responsable</strong></td><td>{activoLocal.responsable || 'Sin asignar'}</td></tr>
                <tr><td><strong>Ciclo de vida</strong></td><td><span class="tag is-small is-info">{activoLocal.estado_ciclo || 'Operativo'}</span></td></tr>
              </tbody>
            </table>
          </div>
          <div class="column is-6">
            <h3 class="subtitle is-6 has-text-info font-weight-bold mb-2"><i class="fas fa-network-wired mr-1"></i> Auditoría de Red & Ciberseguridad</h3>
            <table class="table is-fullwidth table-dark-custom is-narrow">
              <tbody>
                <tr>
                  <td><strong>Password Default</strong></td>
                  <td>
                    {#if auditoriaRed}
                      <span class="tag {esPasswordDefault ? 'is-danger' : 'is-success'} is-small">{esPasswordDefault ? 'DETECTADA (Riesgo)' : 'Segura'}</span>
                    {:else}<span class="has-text-grey">Sin auditoría</span>{/if}
                  </td>
                </tr>
                <tr><td><strong>Firma / Firmware</strong></td><td><small class="has-text-light">{auditoriaRed?.firmware || 'Auditoría pendiente'}</small></td></tr>
                <tr><td><strong>Último Escaneo</strong></td><td><small class="has-text-light">{formatearFecha(auditoriaRed?.updated)}</small></td></tr>
              </tbody>
            </table>
            <div class="box has-background-dark p-3 mt-3" style="border: 1px solid #334155;">
              <p class="heading has-text-grey-light mb-2"><i class="fas fa-plug mr-1"></i> Puertos Abiertos Detectados</p>
              {#if listaPuertos.length > 0}
                <div class="tags">
                  {#each listaPuertos as p}
                    {@const pInfo = infoPuerto(p)}
                    <span class="tag {pInfo.tagClass} is-small">{pInfo.nombre}</span>
                  {/each}
                </div>
              {:else}<p class="is-size-7 has-text-grey">{cargando ? 'Cargando escaneo...' : 'Sin puertos abiertos o dispositivo inalcanzable.'}</p>{/if}
            </div>
          </div>
          <div class="column is-12 has-text-centered mt-2">
            <div class="box has-background-white has-text-dark p-3" style="display: inline-block; border-radius: 8px;">
              <p class="heading has-text-dark font-weight-bold mb-1">Etiqueta QR – Inventario Físico</p>
              {#if qrUrl}<img src={qrUrl} alt="QR" style="width: 110px; height: 110px;" />{/if}
              <p class="is-size-7 is-family-monospace mt-1 mb-2">{activoLocal.id}</p>
              <button class="button is-small is-dark is-outlined" onclick={imprimirQrIndividual}>
                <span class="icon"><i class="fas fa-qrcode"></i></span><span>Imprimir Etiqueta QR</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot footer-custom is-flex is-justify-content-space-between is-align-items-center">
        <div class="buttons are-small mb-0">
          <button class="button is-small is-link" onclick={() => generarActaPdf(activoLocal, 'entrega', null, auditoriaRed)}>
            <span class="icon"><i class="fas fa-file-pdf"></i></span><span>Acta PDF (Servidor/NVR)</span>
          </button>
          {#if onAbrirEditar && esAdmin}
            <button class="button is-small is-warning is-outlined ml-2" onclick={() => onAbrirEditar(activoLocal)}>
              <span class="icon"><i class="fas fa-edit"></i></span><span>Editar Ficha</span>
            </button>
          {/if}
        </div>
        <div class="buttons are-small mb-0">
          {#if esAdmin}
            <button class="button is-small is-warning is-outlined {escaneando ? 'is-loading' : ''}" onclick={solicitarReescaneo} disabled={escaneando}>
              <span class="icon"><i class="fas fa-sync {escaneando ? 'fa-spin' : ''}"></i></span>
              <span>{escaneando ? 'Re-auditando red...' : 'Re-auditar Red'}</span>
            </button>
          {/if}
          <button class="button is-dark is-small" onclick={closeModal}>Cerrar</button>
        </div>
      </footer>
    </div>
  {/if}
</div>