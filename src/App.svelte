<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PocketBase from 'pocketbase';

  // Importar componentes hijos
  import Navbar from './components/Navbar.svelte';
  import StatsLevel from './components/StatsLevel.svelte';
  import SidebarMenu from './components/SidebarMenu.svelte';
  import DashboardView from './components/DashboardView.svelte';
  import InventoryTable from './components/InventoryTable.svelte';
  import DetailModal from './components/DetailModal.svelte';
  import ServerNvrModal from './components/ServerNvrModal.svelte';
  import EditAssetModal from './components/EditAssetModal.svelte';
  import Toast from './components/Toast.svelte';
  import LoginView from './components/LoginView.svelte';

  const pb = new PocketBase(typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : 'http://127.0.0.1:8090');

  // Estado de autenticación
  let estaAutenticado = $state(false);

  let activos = $state<any[]>([]);
  let shadowItList = $state<any[]>([]);
  let cargando = $state(false);
  let errorRed = $state<string | null>(null);

  let search = $state("");
  let filtroTipo = $state("Todos");
  let filtroNivel = $state("Todos");
  let sucursal = $state("Sede Central");
  let sucursales = ["Sede Central", "Sucursal Norte", "Sucursal Sur", "Bodega Central"];

  let perPage = $state(6);
  let currentPage = $state(1);

  // Modales de Detalle / Auditoría
  let modalActivo = $state<any>(null);
  let showModal = $state(false);

  // Modal de Edición de Activo
  let modalEditarActivo = $state<any>(null);
  let showEditModal = $state(false);

  // Detectar si el usuario es administrador
  let esAdmin = $derived(pb.authStore.model?.role === 'admin');
  // Guardar si la vista actual fue abierta desde un QR
  let urlVerId = $state<string | null>(null);

  function openModal(a: any){ modalActivo = a; showModal = true; }
  function closeModal() { 
    showModal = false; 
    setTimeout(() => { 
      modalActivo = null;
      // Si estábamos en la vista móvil de QR y cerramos, enviamos al usuario al Dashboard limpio
      if (urlVerId) window.location.href = '/'; 
    }, 200); 
  }

  function openEditModal(activo: any) {
    // Validar si el usuario actual es administrador
    const usuarioActual = pb.authStore.model;
    if (!usuarioActual || usuarioActual.role !== 'admin') {
      triggerToast("Acceso denegado: Se requiere rol de administrador para editar activos", "is-danger");
      return;
    }

    showModal = false; // Cierra el modal de detalle si estaba abierto
    modalEditarActivo = activo;
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    setTimeout(() => modalEditarActivo = null, 200);
  }

  function scoreClass(s: any){
    if(s == null) return "is-dark";
    if(s >= 80) return "is-success";
    if(s >= 50) return "is-warning";
    return "is-danger";
  }

  function rowClass(s: any){
    if(s == null) return "has-background-grey-lighter";
    if(s < 50) return "has-background-danger-light";
    return "";
  }

  let shadowFormateados = $derived(shadowItList.map((item: any) => ({
    id: item.id,
    hostname: `SHADOW-${item.mac_detectada?.replaceAll(':', '') || 'DEV'}`,
    ip: item.ip_detectada,
    mac: item.mac_detectada,
    tipo: 'Shadow IT',
    estado_ciclo: item.estado || 'Detectado',
    isShadow: true,
    score_seguridad: 0,
    ubicacion: 'Red Wi-Fi (No autorizada)',
    responsable: 'Desconocido'
  })));

  // 1. Activos oficiales separados de Shadow IT
  let activosValidos = $derived(activos.filter(a => a.ip !== "192.168.1.1"));
  let todosLosDispositivos = $derived([...activosValidos, ...shadowFormateados]);

  // 2. Filtro optimizado para separar Shadow IT y manejar tipos y score crítico
  let filtered = $derived.by(() => {
    const q = search.toLowerCase();

    if (filtroTipo === "Shadow IT") {
      return shadowFormateados.filter(a => 
        !q ||
        (a.hostname || "").toLowerCase().includes(q) ||
        (a.ip || "").includes(q) ||
        (a.mac || "").toLowerCase().includes(q) ||
        (a.responsable || "").toLowerCase().includes(q)
      );
    }

    return activosValidos.filter(a => {
      const matchSearch = !q ||
        (a.hostname || "").toLowerCase().includes(q) ||
        (a.ip || "").includes(q) ||
        (a.mac || "").toLowerCase().includes(q) ||
        (a.responsable || "").toLowerCase().includes(q);

      let matchTipo = true;
      if (filtroTipo === "Todos") {
        matchTipo = true;
      } else if (filtroTipo === "Crítico") {
        // Aquí evaluamos el puntaje en lugar del tipo de equipo
        matchTipo = (a.score_seguridad ?? a.score) < 50;
      } else {
        matchTipo = a.tipo === filtroTipo;
      }

      return matchSearch && matchTipo;
    });
  });

  // 3. Estadísticas basadas netamente en los activos oficiales
  let stats = $derived.by(() => {
    const oficiales = activosValidos;
    const conScore = oficiales.filter(a => (a.score_seguridad) != null);
    const totalScore = conScore.reduce((sum, a) => sum + (a.score_seguridad), 0);
    const promedio = conScore.length > 0 ? Math.round(totalScore / conScore.length) : 0;
    return {
      total: oficiales.length,
      promedio: promedio,
      criticos: conScore.filter(a => (a.score_seguridad) < 50).length,
      shadow: shadowFormateados.length,
      nvrs: oficiales.filter(a => a.tipo === "NVR").length,
      pcs: oficiales.filter(a => a.tipo === "PC").length,
      servidores: oficiales.filter(a => a.tipo === "Servidor").length,
    };
  });

  let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / perPage)));
  let paginated = $derived(filtered.slice((currentPage - 1) * perPage, currentPage * perPage));
  let pages = $derived(Array.from({length: totalPages}, (_,i)=> i+1));

  function goPage(n: any){ if(n>=1 && n<=totalPages) currentPage = n; }
  function setTipo(t: any){ 
    filtroTipo = t; 
    currentPage = 1; 
    vista = "Inventario"; // <-- ESTO CAMBIA AUTOMÁTICAMENTE A LA VISTA DE INVENTARIO
  }
  function onSearchInput(){ currentPage=1; }

  let vista = $state("Dashboard");
  let toast = $state({ show: false, message: "", type: "is-info" });
  let toastTimer: any = null;

  function triggerToast(msg: any, type = "is-info") {
    if (toastTimer) clearTimeout(toastTimer);
    toast = { show: true, message: msg, type: type };
    toastTimer = setTimeout(() => { toast.show = false; toastTimer = null; }, 3000);
  }

  async function actualizarDesdePocketBase(silencioso = false) {
    cargando = true;
    errorRed = null;
    try {
      // 1. Definimos las opciones base para la consulta de activos
      const opcionesActivos: any = {
        sort: '-created',
        requestKey: null // Evita autocancelación
      };

      // 2. Solo agregamos el filtro si NO es "Todas"
      if (sucursal && sucursal !== 'Todas') {
        opcionesActivos.filter = `ubicacion = "${sucursal}"`;
      }

      const [recordsActivos, recordsShadow] = await Promise.all([
        pb.collection('activos').getFullList(opcionesActivos),
        pb.collection('shadow_it').getFullList({ 
          sort: '-created',
          requestKey: null 
        })
      ]);
      
      activos = recordsActivos;
      shadowItList = recordsShadow;
      
      if (!silencioso) {
        triggerToast(`Sincronización completa: ${activosValidos.length} elementos cargados`, "is-success");
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.status === 0) return;

      console.error("--- ERROR REAL DE POCKETBASE ---", err);
      const mensajeReal = err?.message || JSON.stringify(err);
      errorRed = "Error de BD: " + mensajeReal;
      if (!silencioso) triggerToast("Error: " + mensajeReal, "is-danger");
    } finally {
      cargando = false;
    }
  }

  

  async function abrirAssetPorId(id: string) {
    let assetToOpen = todosLosDispositivos.find(a => a.id === id);
    if (!assetToOpen) {
      try {
        assetToOpen = await pb.collection('activos').getOne(id);
      } catch (err) {
        console.warn("No se pudo obtener el activo del QR desde PocketBase:", err);
      }
    }
    if (assetToOpen) {
      openModal(assetToOpen);
    }
  }

  async function aprobarShadowIt(item: any, tipoManual: string = 'PC') {
    // Validar si el usuario actual es administrador
    const usuarioActual = pb.authStore.model;
    if (!usuarioActual || usuarioActual.role !== 'admin') {
      triggerToast("Acceso denegado: Se requiere rol de administrador para aprobar dispositivos", "is-danger");
      return;
    }

    try {
      if (!item) {
        triggerToast("Error: El dispositivo seleccionado es inválido", "is-danger");
        return;
      }

      const macReal = item.mac || '00:00:00:00:00:00';
      const ipReal = item.ip || '0.0.0.0';
      const serialUnico = `SN-${macReal.replaceAll(':', '').toUpperCase()}`;
      const hostnameAsignado = item.hostname && !item.hostname.startsWith('SHADOW-') 
        ? item.hostname 
        : `PC-${ipReal.replaceAll('.', '-')}`;

      // 1. Crear el nuevo activo oficial
      const nuevoActivo = {
        hostname: hostnameAsignado,
        ip: ipReal,
        mac: macReal,
        tipo: tipoManual,
        estado_ciclo: 'Operativo',
        score_seguridad: 100,
        ubicacion: sucursal,
        responsable: 'Asignado Manualmente',
        n_serie: serialUnico
      };

      const resActivo = await pb.collection('activos').create(nuevoActivo);

      // 2. Inicializar la evaluación de red
      try {
        await pb.collection('evaluaciones_red').create({
          activo: resActivo.id,
          firmware: "Pendiente de escaneo",
          vulnerabilidades: JSON.stringify([]),
          puertos_abiertos: JSON.stringify([]),
          host_asociado: hostnameAsignado,
          ip_asociada: ipReal
        });
      } catch (evalErr) {
        console.warn("No se pudo instanciar evaluación inicial:", evalErr);
      }

      // 3. Eliminar de la lista de Shadow IT
      if (item.id) {
        try {
          await pb.collection('shadow_it').delete(item.id);
        } catch (e) {
          console.warn("Registro Shadow IT ya no existía en PocketBase", e);
        }
      }

      triggerToast(`Dispositivo ${ipReal} promovido a activo oficial`, "is-success");
      closeModal();
      await actualizarDesdePocketBase();

    } catch (err: any) {
      console.error("--- ERROR EN POCKETBASE ---", err);
      const detalle = err?.data?.message || err?.message || JSON.stringify(err);
      triggerToast("Error al aprobar: " + detalle, "is-danger");
    }
  }

  $effect(() => {
    if (estaAutenticado && sucursal) {
      actualizarDesdePocketBase(true);
    }
  });

  onMount(async () => {
    estaAutenticado = pb.authStore.isValid;

    const urlParams = new URLSearchParams(window.location.search);
    const verId = urlParams.get('ver');

    if (verId) {
      urlVerId = verId;
    }

    if (verId && !estaAutenticado) {
      sessionStorage.setItem('pending_ver', verId);
    }

    if (estaAutenticado) {
      await actualizarDesdePocketBase(!!verId);

      if (verId) {
        await abrirAssetPorId(verId);
      }
    }

    try {
      await pb.collection('activos').subscribe('*', (e) => {
        if (e.action === 'create' && !activos.some(a => a.id === e.record.id)) activos = [e.record, ...activos];
        else if (e.action === 'update') activos = activos.map(a => a.id === e.record.id ? e.record : a);
        else if (e.action === 'delete') activos = activos.filter(a => a.id !== e.record.id);
      });
      await pb.collection('shadow_it').subscribe('*', (e) => {
        if (e.action === 'create' && !shadowItList.some(s => s.id === e.record.id)) shadowItList = [e.record, ...shadowItList];
        else if (e.action === 'update') shadowItList = shadowItList.map(s => s.id === e.record.id ? e.record : s);
        else if (e.action === 'delete') shadowItList = shadowItList.filter(s => s.id !== e.record.id);
      });
    } catch (err) {
      console.error("Error suscribiendo realtime PocketBase:", err);
    }
  });

  onDestroy(() => {
    pb.collection('activos').unsubscribe('*').catch(() => {});
    pb.collection('shadow_it').unsubscribe('*').catch(() => {});
  });
</script>

{#if !estaAutenticado}
  <LoginView onLoginExito={async () => {
    estaAutenticado = true;

    const pendingVer = sessionStorage.getItem('pending_ver');
    if (pendingVer) {
      urlVerId = pendingVer;
      sessionStorage.removeItem('pending_ver');
      window.history.replaceState({}, document.title, window.location.pathname);
      await actualizarDesdePocketBase(true);
      await abrirAssetPorId(pendingVer);
    } else {
      await actualizarDesdePocketBase(false);
      triggerToast("Sesión iniciada correctamente", "is-success");
    }
  }} />
{:else}
  
  <!-- AQUI ESTÁ EL PASO E: Ocultar el Dashboard si urlVerId existe -->
  {#if !urlVerId}
    <Navbar bind:sucursal {sucursales} {stats} onSincronizar={() => actualizarDesdePocketBase(false)} />

    <main class="container mt-5 px-4 pb-6">
      <StatsLevel {stats} {scoreClass} />

      <div class="columns">
        <div class="column is-3">
          <SidebarMenu bind:vista bind:search bind:filtroTipo {activosValidos} {onSearchInput} {setTipo} />
        </div>

        <div class="column is-9">
          {#if errorRed}
            <div class="notification is-danger is-light">
              <button class="delete" aria-label="Cerrar" onclick={() => errorRed = null}></button>
              {errorRed}
            </div>
          {/if}

          {#if vista==="Dashboard"}
            <DashboardView {activosValidos} {shadowFormateados} {stats} {openModal} />
          {:else if vista==="Inventario"}
            <InventoryTable {paginated} {totalPages} {currentPage} {goPage} {scoreClass} {rowClass} {openModal} {pages} />
          {/if}
        </div>
      </div>
    </main>
  {:else}
    <!-- ESTE ES EL FONDO AISLADO QUE VERÁ EL CELULAR AL ESCANEAR EL QR -->
    <div style="min-height: 100vh; background-color: #0f172a;"></div>
  {/if}

  <!-- RUTA CONDICIONAL DE MODALES DE DETALLE Y AUDITORÍA -->
  {#if modalActivo && showModal}
    {#if modalActivo.tipo === 'Servidor' || modalActivo.tipo === 'NVR'}
      <ServerNvrModal 
        bind:showModal 
        {modalActivo} 
        {closeModal} 
        onSolicitarRescaneo={(activo) => triggerToast(`Re-escaneo solicitado para ${activo.hostname}`, "is-info")}
        onAbrirEditar={esAdmin ? openEditModal : undefined}
      />
    {:else}
      <DetailModal 
        bind:showModal 
        {modalActivo} 
        {closeModal} 
        onAprobar={esAdmin ? aprobarShadowIt : undefined} 
        onAbrirEditar={esAdmin ? openEditModal : undefined}
      />
    {/if}
  {/if}

  <!-- MODAL DE EDICIÓN DE FICHA TÉCNICA (RF-01) -->
  {#if esAdmin}
    <EditAssetModal 
      bind:showEditModal 
      activo={modalEditarActivo} 
      closeEditModal={closeEditModal} 
      onGuardarExito={async (msg) => {
        triggerToast(msg, "is-success");
        await actualizarDesdePocketBase();
      }} 
    />
  {/if}
{/if}

<Toast {toast} />