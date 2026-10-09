<script lang="ts">
  let { stats, scoreClass } = $props();
</script>

<nav class="level mb-5">
  <div class="level-item has-text-centered">
    <div class="box has-background-white-bis w-100">
      <p class="heading">Total Activos</p>
      <p class="title is-4 has-text-grey-darker">{stats.total}</p>
      <p class="is-size-7 has-text-grey">
        <i class="fas fa-laptop mr-1"></i> {stats.pcs} PCs • {stats.servidores} Servers • {stats.nvrs} NVRs
      </p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div class="box has-background-white-bis w-100">
      <p class="heading">Score Promedio</p>
      <p class="title is-4 {stats.promedio >= 80 ? 'has-text-success' : stats.promedio >= 50 ? 'has-text-warning' : 'has-text-danger'}">
        {stats.promedio}/100
      </p>
      <progress class="progress is-small {scoreClass(stats.promedio)}" value={stats.promedio} max="100"></progress>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div class="box has-background-white-bis w-100">
      <p class="heading">Equipos en Riesgo</p>
      <p class="title is-4 has-text-danger">{stats.criticos}</p>
      <span class="tag is-danger is-light">
        <i class="fas fa-exclamation-triangle mr-1"></i> Score &lt; 50
      </span>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div class="box {stats.shadow > 0 ? 'has-background-grey-lighter' : 'has-background-white-bis'} w-100">
      <p class="heading">Shadow IT / Cuarentena</p>
      <p class="title is-4 {stats.shadow > 0 ? 'has-text-grey-dark' : 'has-text-info'}">{stats.shadow}</p>
      <span class="tag {stats.shadow > 0 ? 'has-background-grey has-text-white' : 'is-info'} is-light">MACs desconocidas</span>
    </div>
  </div>
</nav>