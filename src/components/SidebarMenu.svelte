<script lang="ts">
  let { vista = $bindable(), search = $bindable(), filtroTipo = $bindable(), activosValidos, onSearchInput, setTipo } = $props();

  let criticosCount = $derived(activosValidos.filter((a: any) => !a.isShadow && (a.score_seguridad ?? a.score) < 50).length);
  let pcsCount = $derived(activosValidos.filter((a: any) => !a.isShadow && a.tipo === 'PC').length);
  let serversCount = $derived(activosValidos.filter((a: any) => !a.isShadow && a.tipo === 'Servidor').length);
  let nvrsCount = $derived(activosValidos.filter((a: any) => !a.isShadow && a.tipo === 'NVR').length);
  let shadowCount = $derived(activosValidos.filter((a: any) => a.isShadow).length);
</script>

<!-- Sección de Navegación Principal del Dashboard -->
<aside class="menu box mb-4">
  <p class="menu-label">Navegación</p>
  <ul class="menu-list">
    <li>
      <button 
        type="button"
        class={vista === 'Dashboard' ? 'is-active w-full has-text-left' : 'w-full has-text-left'} 
        onclick={() => vista = 'Dashboard'}
      >
        <span class="icon is-small"><i class="fas fa-home"></i></span>
        <span>Dashboard</span>
      </button>
    </li>
    <li>
      <button 
        type="button"
        class={vista === 'Inventario' ? 'is-active w-full has-text-left' : 'w-full has-text-left'} 
        onclick={() => vista = 'Inventario'}
      >
        <span class="icon is-small"><i class="fas fa-boxes"></i></span>
        <span>Inventario</span>
      </button>
    </li>
  </ul>
</aside>

<!-- Panel Lateral de Filtros de Seguridad -->
<nav class="panel is-link">
  <p class="panel-heading">Filtros de Seguridad</p>
  
  <div class="panel-block">
    <p class="control has-icons-left">
      <input 
        class="input is-small" 
        type="text" 
        placeholder="Buscar IP, Hostname..." 
        bind:value={search} 
        oninput={onSearchInput} 
      />
      <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
    </p>
  </div>

  <button 
    type="button"
    class="panel-block w-full has-text-left {filtroTipo === 'Todos' ? 'is-active' : ''}" 
    onclick={() => setTipo('Todos')}
  >
    <span class="panel-icon"><i class="fas fa-desktop"></i></span>
    <span>Todos los Activos ({activosValidos.length})</span>
  </button>

  <button 
    type="button"
    class="panel-block w-full has-text-left {filtroTipo === 'PC' ? 'is-active' : ''}" 
    onclick={() => setTipo('PC')}
  >
    <span class="panel-icon"><i class="fas fa-laptop"></i></span>
    <span>PCs ({pcsCount})</span>
  </button>

  <button 
    type="button"
    class="panel-block w-full has-text-left {filtroTipo === 'Servidor' ? 'is-active' : ''}" 
    onclick={() => setTipo('Servidor')}
  >
    <span class="panel-icon"><i class="fas fa-server"></i></span>
    <span>Servidores ({serversCount})</span>
  </button>

  <button 
    type="button"
    class="panel-block w-full has-text-left {filtroTipo === 'NVR' ? 'is-active' : ''}" 
    onclick={() => setTipo('NVR')}
  >
    <span class="panel-icon"><i class="fas fa-video"></i></span>
    <span>NVRs & Cámaras ({nvrsCount})</span>
  </button>

  <button 
    type="button"
    class="panel-block w-full has-text-left {filtroTipo === 'Shadow IT' ? 'is-active' : ''}" 
    onclick={() => setTipo('Shadow IT')}
  >
    <span class="panel-icon"><i class="fas fa-user-secret"></i></span>
    <span>Shadow IT ({shadowCount})</span>
  </button>

  <button 
    type="button"
    class="panel-block w-full has-text-left has-text-danger {filtroTipo === 'Crítico' ? 'is-active' : ''}" 
    onclick={() => setTipo('Crítico')}
  >
    <span class="panel-icon has-text-danger"><i class="fas fa-exclamation-triangle"></i></span>
    <span>Score Crítico (&lt; 50) ({criticosCount})</span>
  </button>
</nav>

<style>
  .panel-block {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    width: 100%;
    text-align: left;
    text-decoration: none;
  }
  
  .menu-list button {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0.5em 0.75em;
    border-radius: 4px;
    color: #4a4a4a;
    width: 100%;
    text-align: left;
  }
  .menu-list button:hover {
    background-color: whitesmoke;
    color: #363636;
  }
  .menu-list button.is-active {
    background-color: #3273dc;
    color: #fff;
  }
</style>