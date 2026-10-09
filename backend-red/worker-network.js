const { exec } = require('child_process');
require('dotenv').config();
const PocketBase = require('pocketbase/cjs');

const PB_URL = process.env.PUBLIC_POCKETBASE_INTERNAL_URL || process.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;

const pb = new PocketBase(PB_URL);

let macsVistasEnMemoria = new Set();

// Escaneo Nmap para red física + Docker Network Inspect para contenedores
function escanearRedNmap() {
  return new Promise((resolve) => {
    const dispositivos = [];
    const targetSubnet = '192.168.1.0/24'; 

    // 1. Escaneo físico con Nmap
    exec(`nmap -sn ${targetSubnet}`, (err, stdout) => {
      if (!err && stdout) {
        const lines = stdout.split('\n');
        let currentIP = '';

        lines.forEach(line => {
          if (line.includes('Nmap scan report for')) {
            const parts = line.split('for ');
            currentIP = parts[1] ? parts[1].replace(/[()]/g, '').trim() : '';
          }
          if (line.includes('MAC Address:')) {
            const macParts = line.split('MAC Address: ')[1].split(' ');
            const mac = macParts[0].toLowerCase();
            const ipMatch = currentIP.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
            const ip = ipMatch ? ipMatch[0] : currentIP;

            if (ip && mac && mac !== '00:00:00:00:00:00') {
              dispositivos.push({ ip, mac });
            }
          }
        });
      }

      // Detecta contenedores en la red bridge por defecto Y en la red del laboratorio
      exec('docker network inspect bridge laboratorio-auditoria_default', (docErr, docStdout) => {
        if (!docErr && docStdout) {
          try {
            const networks = JSON.parse(docStdout);
            networks.forEach(net => {
              if (net && net.Containers) {
                Object.values(net.Containers).forEach(c => {
                  const ip = c.IPv4Address ? c.IPv4Address.split('/')[0] : null;
                  const mac = c.MacAddress;
                  if (ip && mac) {
                    dispositivos.push({ ip, mac: mac.toLowerCase() });
                  }
                });
              }
            });
          } catch (e) {
            console.error('Error al parsear la red de Docker:', e.message);
          }
        }

        resolve(dispositivos);
      });
    });
  });
}

async function cicloShadowIT() {
  try {
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);
  } catch (authErr) {
    console.error('Error de autenticación en PocketBase:', authErr.message);
    setTimeout(cicloShadowIT, 10000);
    return;
  }

  try {
    const redDetectada = await escanearRedNmap();
    const activosOficiales = await pb.collection('activos').getFullList();
    const macsOficiales = new Set(activosOficiales.map(a => a.mac?.toLowerCase()));

    let nuevosDispositivosEncontrados = 0;

    for (const dev of redDetectada) {
      if (!dev.mac) continue;

      if (macsOficiales.has(dev.mac)) {
        // CASO A: Es un activo oficial, pero su IP pudo haber cambiado
        const activoExistente = activosOficiales.find(a => a.mac?.toLowerCase() === dev.mac);
        if (activoExistente && activoExistente.ip !== dev.ip) {
          await pb.collection('activos').update(activoExistente.id, { ip: dev.ip });
          console.log(`[ACTIVO ACTUALIZADO] ${activoExistente.hostname} cambió su IP a -> ${dev.ip}`);
        }
      } else {
        // CASO B: Es un dispositivo desconocido (Shadow IT)
        if (!macsVistasEnMemoria.has(dev.mac)) {
          macsVistasEnMemoria.add(dev.mac);
          nuevosDispositivosEncontrados++;

          const existeShadow = await pb.collection('shadow_it').getList(1, 1, {
            filter: `mac_detectada = "${dev.mac}"`
          });

          if (existeShadow.items.length === 0) {
            await pb.collection('shadow_it').create({
              ip_detectada: dev.ip,
              mac_detectada: dev.mac,
              estado: 'Cuarentena'
            });
            console.log(`[SHADOW IT DETECTADO] Nuevo dispositivo en cuarentena -> IP: ${dev.ip} | MAC: ${dev.mac}`);
          } else {
            // Actualizar IP si cambió en cuarentena
            await pb.collection('shadow_it').update(existeShadow.items[0].id, {
              ip_detectada: dev.ip
            });
          }
        }
      }
    }

    if (nuevosDispositivosEncontrados === 0) {
      process.stdout.write("."); // Indicador de actividad en consola
    }

  } catch (err) {
    console.error('Error en el ciclo de escaneo:', err.message || err);
  }

  // Repetir el ciclo cada 10 segundos
  setTimeout(cicloShadowIT, 10000);
}

cicloShadowIT();