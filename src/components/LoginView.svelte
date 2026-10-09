<script lang="ts">
  import PocketBase from 'pocketbase';

  let { onLoginExito }: { onLoginExito?: () => void } = $props();

  const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : '');
  const pb = new PocketBase(pbUrl);

  let email = $state('');
  let password = $state('');
  let errorMsg = $state('');
  let cargando = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    cargando = true;
    errorMsg = '';

    try {
      await pb.collection('users').authWithPassword(email, password);
      if (onLoginExito) {
        onLoginExito();
      } else {
        window.location.href = '/'; 
      }
    } catch (err) {
      console.error(err);
      errorMsg = 'Credenciales incorrectas o usuario no autorizado.';
    } finally {
      cargando = false;
    }
  }
</script>

<div class="hero is-fullheight" style="background-color: #172533;">
  <div class="hero-body">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-5-tablet is-4-desktop">
          
          <div class="has-text-centered mb-5">
            <div class="logo-circle mb-3">
              <img src="/logo.jpg" alt="Logo Grupo Antumalal" class="logo-img" />
            </div>
            <h1 class="title is-4 has-text-white mb-1">
              SecurAsset<span class="has-text-warning">.</span>
            </h1>
            <p class="is-size-7 has-text-grey-light">
              Grupo Antumalal — Inventario & Postura de Seguridad
            </p>
          </div>

          <div class="box p-5" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div class="has-text-centered mb-4">
              <p class="is-size-7 has-text-grey text-uppercase has-text-weight-bold" style="letter-spacing: 1px;">Iniciar sesión</p>
            </div>

            {#if errorMsg}
              <div class="notification is-danger is-light py-2 px-3 mb-4 is-size-7">
                {errorMsg}
              </div>
            {/if}

            <form onsubmit={handleLogin}>
              <div class="field">
                <label class="label is-small has-text-grey-dark" for="login-email">Correo</label>
                <div class="control has-icons-left">
                  <input 
                    id="login-email" 
                    class="input is-small" 
                    type="email" 
                    bind:value={email} 
                    required 
                    placeholder="admin@admin" 
                  />
                  <span class="icon is-small is-left has-text-grey-light">
                    <i class="fas fa-envelope"></i>
                  </span>
                </div>
              </div>

              <div class="field mb-5">
                <label class="label is-small has-text-grey-dark" for="login-password">Contraseña</label>
                <div class="control has-icons-left">
                  <input 
                    id="login-password" 
                    class="input is-small" 
                    type="password" 
                    bind:value={password} 
                    required 
                    placeholder="********" 
                  />
                  <span class="icon is-small is-left has-text-grey-light">
                    <i class="fas fa-lock"></i>
                  </span>
                </div>
              </div>

              <button 
                class="button is-warning is-fullwidth {cargando ? 'is-loading' : ''}" 
                type="submit"
                style="background-color: #f6ad55; color: #fff; font-weight: 600;"
              >
                <span class="icon"><i class="fas fa-sign-in-alt"></i></span>
                <span>Ingresar al Dashboard</span>
              </button>
            </form>

            <div class="has-text-centered mt-4">
              <p class="is-size-7 has-text-grey-light">Acceso protegido — Grupo Antumalal</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .logo-circle {
    width: 65px;
    height: 65px;
    background: #ffffff;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 2px solid #e2e8f0;
    margin: 0 auto;
    overflow: hidden;
  }

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 5px;
  }
  .button.is-warning {
    background-color: #f59e0b !important;
    border-color: transparent;
  }
  .button.is-warning:hover {
    background-color: #d97706 !important;
  }
</style>