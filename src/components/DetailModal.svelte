<script lang="ts">
  import PocketBase from 'pocketbase';
  import { generarActaPdf } from './pdf-helper';

  let { 
    showModal = $bindable(), 
    modalActivo, 
    closeModal, 
    onAprobar,
    onAbrirEditar,
    onSolicitarRescaneo
  }: {
    showModal: boolean;
    modalActivo: any;
    closeModal: () => void;
    onAprobar?: (activo: any, tipo: string) => void;
    onAbrirEditar?: (activo: any) => void;
    onSolicitarRescaneo?: (activo: any) => void;
  } = $props();

  const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : '');
  const pb = new PocketBase(pbUrl);

  let esAdmin = $derived(pb.authStore.model?.role === 'admin' || pb.authStore.model?.es_admin === true);

  let activoLocal = $state<any>(null);
  let auditoriaRed = $state<any>(null);
  let evalEndpoint = $state<any>(null);
  let tipoSeleccionado = $state('PC');
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
      evalEndpoint = null;
      escaneando = false;
      if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
      return;
    }

    activoLocal = modalActivo;

    pb.collection('evaluaciones_red')
      .getFirstListItem(`relation="${modalActivo.id}" || host_asociado="${modalActivo.hostname}" || ip_asociada="${modalActivo.ip}"`, { sort: '-created' })
      .then((res) => (auditoriaRed = res))
      .catch(() => (auditoriaRed = null));

    pb.collection('evaluaciones_endpoints')
      .getFirstListItem(`relation="${modalActivo.id}"`, { sort: '-created' })
      .then((res) => (evalEndpoint = res))
      .catch(() => (evalEndpoint = null));

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

    let unsubEvalEndpoint: (() => void) | undefined;
    pb.collection('evaluaciones_endpoints').subscribe('*', (e) => {
      if (e.record.relation === modalActivo.id) {
        evalEndpoint = e.record;
        if (escaneando) {
          const fechaEval = new Date(e.record.created || e.record.updated).getTime();
          if (fechaEval >= tiempoInicioEscaneo - 2000) {
            escaneando = false;
            if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
          }
        }
      }
    }).then((unsub) => { unsubEvalEndpoint = unsub; });

    return () => {
      if (unsubActivo) unsubActivo();
      if (unsubEvalRed) unsubEvalRed();
      if (unsubEvalEndpoint) unsubEvalEndpoint();
      if (timeoutRespaldo) clearTimeout(timeoutRespaldo);
      pb.collection('activos').unsubscribe(modalActivo.id);
      pb.collection('evaluaciones_red').unsubscribe('*');
      pb.collection('evaluaciones_endpoints').unsubscribe('*');
    };
  });

  function parsearVulnerabilidades(vulns: any) {
    if (!vulns) return [];
    if (Array.isArray(vulns)) return vulns;
    try {
      const parsed = JSON.parse(vulns);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [vulns];
    }
  }

  let listaVulns = $derived(parsearVulnerabilidades(auditoriaRed?.vulnerabilidades));

  let esLinux = $derived(
    activoLocal?.hostname?.toLowerCase().includes('kali') ||
      activoLocal?.tipo_so?.toLowerCase().includes('linux') ||
      activoLocal?.tipo?.toLowerCase().includes('linux') ||
      evalEndpoint?.so?.toLowerCase().includes('linux') ||
      evalEndpoint?.tipo_so?.toLowerCase().includes('linux')
  );

  let nombreCifrado = $derived(esLinux ? 'LUKS' : 'BitLocker');

  let listaAlertas = $derived.by(() => {
    const alertas: string[] = [];
    if (evalEndpoint && !evalEndpoint.bitlocker_activo) alertas.push(`Cifrado de disco (${nombreCifrado}) desactivado`);
    if (evalEndpoint && !evalEndpoint.edr_activo) alertas.push('Protección EDR / Antivirus inactiva o no detectada');
    if (evalEndpoint && evalEndpoint.parches_so_al_dia === false) alertas.push('Parches de seguridad del sistema operativo pendientes');
    if (evalEndpoint) {
      let totalAdmins = 0;
      if (evalEndpoint.admin_locales_lista) {
        totalAdmins = evalEndpoint.admin_locales_lista.split(',').filter(Boolean).length;
      } else if (typeof evalEndpoint.admin_locales === 'string' && isNaN(Number(evalEndpoint.admin_locales))) {
        totalAdmins = evalEndpoint.admin_locales.split(',').map((s: string) => s.trim()).filter(Boolean).length;
      } else if (typeof evalEndpoint.admin_locales === 'number') {
        totalAdmins = evalEndpoint.admin_locales;
      }
      if (totalAdmins > 3) alertas.push(`Exceso de administradores locales (${totalAdmins} detectados, máximo recomendado: 3)`);
    }
    if (listaVulns && listaVulns.length > 0) {
      listaVulns.forEach((v: any) => { if (v && typeof v === 'string') alertas.push(v); });
    }
    return alertas;
  });

  let textoAdminsLocales = $derived.by(() => {
    if (!evalEndpoint) return '-';
    if (evalEndpoint.admin_locales_lista) {
      const cantidad = evalEndpoint.admin_locales ?? evalEndpoint.admin_locales_lista.split(',').filter(Boolean).length;
      return `${evalEndpoint.admin_locales_lista} (${cantidad})`;
    }
    if (typeof evalEndpoint.admin_locales === 'string' && isNaN(Number(evalEndpoint.admin_locales))) {
      const lista = evalEndpoint.admin_locales.split(',').map((s: string) => s.trim()).filter(Boolean);
      return `${lista.join(', ')} (${lista.length})`;
    }
    if (typeof evalEndpoint.admin_locales === 'number') return `${evalEndpoint.admin_locales} usuario(s)`;
    return 'Ninguno';
  });

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
    <div class="modal-card modal-dark" style="width: 900px; max-width: 95vw;">
      <header class="modal-card-head header-custom">
        <div class="is-flex is-align-items-center">
          <span class="title is-4 has-text-white mb-0 mr-3">{activoLocal.hostname}</span>
          <span class="tag is-dark mr-2">{activoLocal.tipo || 'Desconocido'}</span>
          <span class="tag {scoreActual >= 80 ? 'is-success' : scoreActual >= 50 ? 'is-warning' : 'is-danger'} is-medium">{scoreActual} pts</span>
        </div>
        <button class="delete is-large" aria-label="close" onclick={closeModal}></button>
      </header>
      <section class="modal-card-body body-custom">
        {#if listaAlertas.length > 0}
          <article class="message is-warning is-small mb-4">
            <div class="message-header py-1"><p><i class="fas fa-exclamation-triangle mr-1"></i> Precaución: observaciones de seguridad detectadas</p></div>
            <div class="message-body">
              <ul style="list-style-type: disc; padding-left: 20px;">
                {#each listaAlertas as alerta}<li>{alerta}</li>{/each}
              </ul>
            </div>
          </article>
        {/if}
        <div class="columns is-multiline">
          {#if activoLocal.isShadow}
            <div class="column is-12">
              <h3 class="subtitle is-6 has-text-danger font-weight-bold mb-2"><i class="fas fa-user-secret mr-1"></i> Información de Dispositivo No Autorizado</h3>
              <table class="table is-fullwidth table-dark-custom is-narrow mb-4">
                <tbody>
                  <tr><td><strong>IP Detectada</strong></td><td>{activoLocal.ip}</td></tr>
                  <tr><td><strong>MAC</strong></td><td><span class="is-family-monospace">{activoLocal.mac}</span></td></tr>
                  <tr><td><strong>Estado</strong></td><td><span class="tag is-warning">Shadow IT / Cuarentena</span></td></tr>
                  <tr><td><strong>Puertos</strong></td><td><small class="has-text-light">{auditoriaRed?.puertos_abiertos || 'Ninguno'}</small></td></tr>
                </tbody>
              </table>
            </div>
          {:else}
            <div class="column is-6">
              <h3 class="subtitle is-6 has-text-info font-weight-bold mb-2"><i class="fas fa-microchip mr-1"></i> Specs de Hardware & Ficha</h3>
              <table class="table is-fullwidth table-dark-custom is-narrow">
                <tbody>
                  <tr><td><strong>Procesador (CPU)</strong></td><td>{evalEndpoint?.cpu || activoLocal.cpu || 'N/A'}</td></tr>
                  <tr><td><strong>Memoria RAM</strong></td><td>{evalEndpoint?.ram || activoLocal.ram || 'N/A'}</td></tr>
                  <tr><td><strong>Almacenamiento</strong></td><td>{evalEndpoint?.disco || activoLocal.disco || 'N/A'}</td></tr>
                  <tr><td><strong>Hostname / IP</strong></td><td>{activoLocal.hostname} ({activoLocal.ip})</td></tr>
                  <tr><td><strong>MAC</strong></td><td><span class="is-family-monospace">{activoLocal.mac}</span></td></tr>
                  <tr><td><strong>N° Serie</strong></td><td>{activoLocal.n_serie || 'No registrado'}</td></tr>
                  <tr><td><strong>Ubicación / Resp.</strong></td><td>{activoLocal.ubicacion || 'Sede'} - {activoLocal.responsable || 'Sin asignar'}</td></tr>
                  <tr><td><strong>Ciclo de vida</strong></td><td><span class="tag is-small is-info">{activoLocal.estado_ciclo || 'Operativo'}</span></td></tr>
                </tbody>
              </table>
            </div>
            <div class="column is-6">
              <h3 class="subtitle is-6 has-text-info font-weight-bold mb-2"><i class="fas fa-shield-alt mr-1"></i> Estado de Seguridad</h3>
              <table class="table is-fullwidth table-dark-custom is-narrow">
                <tbody>
                  {#if activoLocal.tipo === 'PC'}
                    <tr>
                      <td><strong>Cifrado ({nombreCifrado})</strong></td>
                      <td>{#if evalEndpoint}<span class="tag {evalEndpoint.bitlocker_activo ? 'is-success' : 'is-danger'} is-small">{evalEndpoint.bitlocker_activo ? 'ON' : 'OFF'}</span>{:else}<span class="has-text-grey">-</span>{/if}</td>
                    </tr>
                    <tr>
                      <td><strong>EDR / Antivirus</strong></td>
                      <td>{#if evalEndpoint}<span class="tag {evalEndpoint.edr_activo ? 'is-success' : 'is-danger'} is-small">{evalEndpoint.edr_activo ? 'Activo' : 'Inactivo'}</span>{:else}<span class="has-text-grey">-</span>{/if}</td>
                    </tr>
                    <tr>
                      <td><strong>Parches SO</strong></td>
                      <td>{#if evalEndpoint}<span class="tag {evalEndpoint.parches_so_al_dia ? 'is-success' : 'is-warning'} is-small">{evalEndpoint.parches_so_al_dia ? 'Al día' : 'Pendientes'}</span>{:else}<span class="has-text-grey">-</span>{/if}</td>
                    </tr>
                    <tr><td><strong>Admins Locales</strong></td><td><small class="has-text-light">{textoAdminsLocales}</small></td></tr>
                  {:else}
                    <tr><td><strong>Password Default</strong></td><td><span class="tag {auditoriaRed?.password_default ? 'is-danger' : 'is-success'} is-small">{auditoriaRed?.password_default ? 'Riesgo' : 'OK'}</span></td></tr>
                    <tr><td><strong>Puertos</strong></td><td><small class="has-text-light">{auditoriaRed?.puertos_abiertos || 'Ninguno'}</small></td></tr>
                    <tr><td><strong>Firmware</strong></td><td><small class="has-text-light">{auditoriaRed?.firmware || 'Sin registrar'}</small></td></tr>
                  {/if}
                </tbody>
              </table>
            </div>
            <div class="column is-12 has-text-centered mt-2">
              <div class="box has-background-white has-text-dark p-3" style="display: inline-block; border-radius: 8px;">
                <p class="heading has-text-dark font-weight-bold mb-1">Etiqueta QR – Inventario físico</p>
                {#if qrUrl}<img src={qrUrl} alt="QR" style="width: 120px; height: 120px;" />{/if}
                <p class="is-size-7 is-family-monospace mt-1 mb-2">{activoLocal.id}</p>
                <button class="button is-small is-dark is-outlined" onclick={imprimirQrIndividual}>
                  <span class="icon"><i class="fas fa-qrcode"></i></span><span>Imprimir Etiqueta QR</span>
                </button>
              </div>
            </div>
          {/if}
        </div>
      </section>
      <footer class="modal-card-foot footer-custom is-flex is-justify-content-space-between is-align-items-center">
        <div class="buttons are-small mb-0">
          {#if !activoLocal.isShadow}
            <button class="button is-small is-link" onclick={() => generarActaPdf(activoLocal, 'entrega', evalEndpoint, auditoriaRed)}>
              <span class="icon"><i class="fas fa-file-pdf"></i></span><span>Acta PDF (entrega)</span>
            </button>
            {#if onAbrirEditar && esAdmin}
              <button class="button is-small is-warning ml-2" onclick={() => onAbrirEditar(activoLocal)}>
                <span class="icon"><i class="fas fa-edit"></i></span><span>Editar Ficha</span>
              </button>
            {/if}
          {/if}
        </div>
        <div class="is-flex is-align-items-center">
          {#if activoLocal.isShadow && onAprobar && esAdmin}
            <div class="is-flex is-align-items-center mr-3">
              <label class="label is-small has-text-white mr-2 mb-0" for="select-tipo">Tipo:</label>
              <div class="control">
                <div class="select is-small">
                  <select id="select-tipo" bind:value={tipoSeleccionado}>
                    <option value="PC">PC</option><option value="Servidor">Servidor</option><option value="NVR">NVR</option>
                  </select>
                </div>
              </div>
            </div>
            <button class="button is-success is-small mr-2" onclick={() => onAprobar && onAprobar(activoLocal, tipoSeleccionado)}>
              <span class="icon"><i class="fas fa-check"></i></span><span>Aprobar y Pasar a Activo</span>
            </button>
          {/if}
          {#if !activoLocal.isShadow && esAdmin}
            <button class="button is-small is-warning is-outlined mr-2 {escaneando ? 'is-loading' : ''}" onclick={solicitarReescaneo} disabled={escaneando}>
              <span class="icon"><i class="fas fa-sync {escaneando ? 'fa-spin' : ''}"></i></span>
              <span>{escaneando ? 'Escaneando PC...' : 'Re-escanear PC'}</span>
            </button>
          {/if}
          <button class="button is-dark is-small" onclick={closeModal}>Cerrar</button>
        </div>
      </footer>
    </div>
  {/if}
</div>