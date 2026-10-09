<script lang="ts">
  import PocketBase from 'pocketbase';

  const pb = new PocketBase('http://127.0.0.1:8090');

  let email = $state('');
  let password = $state('');
  let errorMsg = $state('');
  let cargando = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    cargando = true;
    errorMsg = '';

    try {
      // Autenticar con PocketBase
      await pb.collection('users').authWithPassword(email, password);
      
      // Redirigir al dashboard principal usando JavaScript nativo
      window.location.href = '/'; 
    } catch (err) {
      console.error(err);
      errorMsg = 'Credenciales incorrectas o usuario no autorizado.';
    } finally {
      cargando = false;
    }
  }
</script>

<div class="hero is-fullheight is-dark">
  <div class="hero-body">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-5-tablet is-4-desktop">
          <form class="box p-6" onsubmit={handleLogin} style="background-color: #1e293b; border: 1px solid #334155;">
            <h1 class="title is-4 has-text-white has-text-centered mb-4">SecurAsset Login</h1>
            
            {#if errorMsg}
              <div class="notification is-danger is-light py-2 px-3 mb-4 is-size-7">
                {errorMsg}
              </div>
            {/if}

            <div class="field">
                <label class="label has-text-light is-small" for="email-input">Correo Electrónico</label>
                <div class="control">
                    <input id="email-input" class="input" type="email" bind:value={email} required placeholder="admin@securasset.local" />
                </div>
            </div>

            <div class="field">
                <label class="label has-text-light is-small" for="password-input">Contraseña</label>
                <div class="control">
                    <input id="password-input" class="input" type="password" bind:value={password} required placeholder="**********" />
                </div>
            </div>

            <button class="button is-link is-fullwidth {cargando ? 'is-loading' : ''}" type="submit">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>