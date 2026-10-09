const { exec } = require('child_process');
const http = require('http');
const https = require('https');
const tls = require('tls');

const EventModule = require('eventsource');
global.EventSource = EventModule.EventSource || EventModule;
const PocketBase = require('pocketbase/cjs');

const PB_URL = 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

// Desactivar auto-cancelación (Fundamental para workers backend)
pb.autoCancellation(false);

const activosEnAuditoria = new Set();
let suscripcionRealtimeActiva = false;

// Función auxiliar para ejecutar comandos del sistema
function ejecutarComando(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout) => {
      if (error) return resolve('');
      resolve(stdout);
    });
  });
}

// Mapeador dinámico de IP/Hostname a Nombre de Contenedor Docker
function resolverNombreContenedor(ip, hostname = '') {
  const h = hostname.toLowerCase();
  if (ip.endsWith('.2') || h.includes('nvr-lab')) return 'nvr-lab';
  if (ip.endsWith('.3') || h.includes('servidor-lab')) return 'servidor-lab';
  if (ip.endsWith('.4') || h.includes('tls')) return 'servidor-tls';
  if (ip.endsWith('.5') || h.includes('router')) return 'router-legacy';
  if (ip.endsWith('.6') || h.includes('win')) return 'win-vulnerable';
  if (ip.endsWith('.7') || h.includes('nvr-vulnerable')) return 'nvr-vulnerable';
  return null;
}

// Obtiene dinámicamente los puertos expuestos en localhost desde Docker
async function obtenerPuertosMapeadosDocker(containerName) {
  if (!containerName) return [];
  const stdout = await ejecutarComando(`docker port ${containerName}`);
  const mapeos = [];
  if (!stdout) return mapeos;

  const lineas = stdout.trim().split('\n');
  lineas.forEach(linea => {
    const partes = linea.split('->');
    if (partes.length === 2) {
      const puertoInterno = partes[0].trim().split('/')[0];
      const puertoHost = partes[1].trim().split(':')[1];
      mapeos.push({ interno: puertoInterno, host: puertoHost });
    }
  });
  return mapeos;
}

// Escaneo genérico y exhaustivo de puertos
async function escanearPuertosActivo(ip, activo) {
  let puertosAbiertos = [];

  if (ip.startsWith('172.18.') || ip.startsWith('172.17.')) {
    const containerName = resolverNombreContenedor(ip, activo.hostname);
    const mapeos = await obtenerPuertosMapeadosDocker(containerName);

    for (const m of mapeos) {
      const comando = `nmap -p ${m.host} --open -T4 -Pn 127.0.0.1`;
      const salida = await ejecutarComando(comando);
      if (salida.includes('open')) {
        puertosAbiertos.push(m.interno);
      }
    }
  } else {
    const puertosComunes = "22,80,443,554,3389,13389";
    const comando = `nmap -p ${puertosComunes} --open -T4 -Pn ${ip}`;
    const salida = await ejecutarComando(comando);

    const lineas = salida.split('\n');
    lineas.forEach(linea => {
      if (linea.includes('/tcp') && linea.includes('open')) {
        const puertoNum = linea.trim().split(/\s+/)[0].split('/')[0];
        puertosAbiertos.push(puertoNum);
      }
    });
  }

  return [...new Set(puertosAbiertos)];
}

// Petición HTTP para probar credenciales (Basic Auth)
function probarCredencialHttp(targetIp, targetPort, user, pass) {
  return new Promise((resolve) => {
    const protocol = (targetPort === '443' || targetPort === '8443') ? https : http;
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');

    const options = {
      hostname: targetIp,
      port: parseInt(targetPort),
      path: '/',
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` },
      timeout: 3000
    };

    const req = protocol.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 204) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

// Verificación de contraseñas por defecto
async function verificarPasswordDefault(ip, puertos, activo) {
  let targetIp = ip;
  let targetPort = puertos.includes('443') ? '443' : (puertos.includes('80') ? '80' : null);

  if (ip.startsWith('172.18.') || ip.startsWith('172.17.')) {
    targetIp = '127.0.0.1';
    const containerName = resolverNombreContenedor(ip, activo.hostname);
    const mapeos = await obtenerPuertosMapeadosDocker(containerName);
    const mapWeb = mapeos.find(m => m.interno === '80' || m.interno === '443');
    if (mapWeb) targetPort = mapWeb.host;
    else targetPort = null;
  }

  if (!targetPort) return false;

  const credencialesDefault = [
    { user: 'admin', pass: ''},
    { user: 'admin', pass: 'admin' },
    { user: 'admin', pass: '12345' },
    { user: 'root', pass: ''},
    { user: 'root', pass: 'root' }
  ];

  for (const cred of credencialesDefault) {
    const esVulnerable = await probarCredencialHttp(targetIp, targetPort, cred.user, cred.pass);
    if (esVulnerable) return true;
  }

  return false;
}

function obtenerFirmaHTTP(targetIp, targetPort) {
  return new Promise((resolve) => {
    if (!targetPort) return resolve(null);

    const protocol = (targetPort === '443' || targetPort === '8443') ? https : http;
    const options = {
      hostname: targetIp,
      port: parseInt(targetPort),
      path: '/',
      method: 'HEAD',
      timeout: 3000
    };

    const req = protocol.request(options, (res) => {
      const serverHeader = res.headers['server'];
      if (serverHeader && serverHeader.trim() !== '') {
        resolve(serverHeader);
      } else {
        resolve(null);
      }
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function obtenerFirmaTLS(targetIp, targetPort) {
  return new Promise((resolve) => {
    if (!targetPort) return resolve(null);

    const socket = tls.connect({
      host: targetIp,
      port: parseInt(targetPort),
      rejectUnauthorized: false,
      timeout: 3000
    }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();

      if (cert && cert.subject) {
        const emisor = cert.subject.O || cert.subject.OU || cert.subject.CN;
        if (emisor) return resolve(`TLS Cert: ${emisor}`);
      }
      resolve(null);
    });

    socket.on('error', () => resolve(null));
    socket.on('timeout', () => { socket.destroy(); resolve(null); });
  });
}

async function obtenerFirmaNmap(targetIp, targetPort) {
  if (!targetPort) return null;
  
  const cmd = `nmap -sV --version-intensity 2 -p ${targetPort} ${targetIp}`;
  const salida = await ejecutarComando(cmd);

  const lineas = salida.split('\n');
  const lineaServicio = lineas.find(l => l.includes(`${targetPort}/tcp`));

  if (lineaServicio && lineaServicio.includes('open')) {
    const partes = lineaServicio.trim().split(/\s+/);
    const versionInfo = partes.slice(3).join(' ');
    if (versionInfo && versionInfo !== 'unknown') {
      return `Nmap Service: ${versionInfo}`;
    }
  }

  return null;
}

async function obtenerFirmaFirmwareHibrida(targetIp, targetPort) {
  if (!targetPort) return 'Sin servicio web expuesto';

  const firmaHTTP = await obtenerFirmaHTTP(targetIp, targetPort);
  if (firmaHTTP) return `HTTP Banner: ${firmaHTTP}`;

  if (targetPort === '443' || targetPort === '8443') {
    const firmaTLS = await obtenerFirmaTLS(targetIp, targetPort);
    if (firmaTLS) return firmaTLS;
  }

  const firmaNmap = await obtenerFirmaNmap(targetIp, targetPort);
  if (firmaNmap) return firmaNmap;

  return 'Protegido / Cabecera Omitida (Hardened)';
}

function calcularScoreRed(passDefault, puertos, tipoActivo, firma) {
  let score = 100;
  if (passDefault) score -= 40;
  if (puertos.includes('22') && tipoActivo === 'NVR') score -= 25;
  if (puertos.includes('3389')) score -= 20;
  if (firma && firma.match(/\/[0-9]+\.[0-9]+/)) score -= 15;
  return Math.max(0, score);
}

// Función desacoplada para auditar UN solo activo
async function auditarActivoIndividual(activo) {
  if (!activo || !activo.ip) return;

  console.log(`[AUDITORÍA SOLICITADA] Auditando activo: ${activo.hostname} (${activo.ip})...`);

  const puertosAbiertos = await escanearPuertosActivo(activo.ip, activo);
  const estaOnline = puertosAbiertos.length > 0;

  if (!estaOnline) {
    console.log(`[AVISO] ${activo.hostname} (${activo.ip}) está OFFLINE. Actualizando score a 0...`);
    
    // Apagar forzar_escaneo_manual al actualizar score
    await pb.collection('activos').update(activo.id, { 
      score_seguridad: 0,
      forzar_escaneo_manual: false 
    });

    try {
      const existente = await pb.collection('evaluaciones_red').getFirstListItem(`relation="${activo.id}"`);
      await pb.collection('evaluaciones_red').update(existente.id, {
        estado_conexion: "Offline",
        score: 0,
        vulnerabilidades: JSON.stringify(["Dispositivo fuera de línea / Inalcanzable"])
      });
    } catch (e) {
      await pb.collection('evaluaciones_red').create({
        relation: activo.id,
        host_asociado: activo.hostname,
        ip_asociada: activo.ip,
        puertos_abiertos: JSON.stringify([]),
        password_default: false,
        firmware: "Desconectado / Inalcanzable",
        vulnerabilidades: JSON.stringify(["Dispositivo fuera de línea"]),
        estado_conexion: "Offline",
        score: 0
      });
    }
    return;
  }

  const passDefaultDetectada = await verificarPasswordDefault(activo.ip, puertosAbiertos, activo);

  let targetIpHeader = activo.ip;
  let targetPortHeader = null;

  if (activo.ip.startsWith('172.18.') || activo.ip.startsWith('172.17.')) {
    targetIpHeader = '127.0.0.1';
    const containerName = resolverNombreContenedor(activo.ip, activo.hostname);
    const mapeos = await obtenerPuertosMapeadosDocker(containerName);
    const mapWeb = mapeos.find(m => m.interno === '80' || m.interno === '443');
    if (mapWeb) targetPortHeader = mapWeb.host;
  } else {
    if (puertosAbiertos.includes('443')) targetPortHeader = '443';
    else if (puertosAbiertos.includes('80')) targetPortHeader = '80';
  }

  const firmaDetectada = await obtenerFirmaFirmwareHibrida(targetIpHeader, targetPortHeader);

  let vulnerabilidades = [];
  if (passDefaultDetectada) vulnerabilidades.push("Contraseña por defecto de fábrica detectada vía HTTP");
  if (puertosAbiertos.includes('22') && (activo.tipo === 'NVR' || activo.hostname.toLowerCase().includes('nvr'))) {
    vulnerabilidades.push("Puerto SSH 22 abierto en dispositivo NVR");
  }
  if (puertosAbiertos.includes('554')) vulnerabilidades.push("Servicio RTSP (554) expuesto en la red");
  if (puertosAbiertos.includes('3389')) vulnerabilidades.push("Servicio de Escritorio Remoto RDP (3389) expuesto directamente sin VPN");
  if (firmaDetectada && firmaDetectada.match(/\/[0-9]+\.[0-9]+/)) vulnerabilidades.push("Fuga de información: Versión exacta del servidor expuesta");
  
  if (vulnerabilidades.length === 0) vulnerabilidades.push("Sin vulnerabilidades críticas detectadas");

  const nuevoScore = calcularScoreRed(passDefaultDetectada, puertosAbiertos, activo.tipo, firmaDetectada);

  // CLAVE: Siempre enviar forzar_escaneo_manual: false para que el evento Realtime no reactive un re-escaneo
  await pb.collection('activos').update(activo.id, { 
    score_seguridad: nuevoScore,
    forzar_escaneo_manual: false
  });

  const payloadEvaluacionRed = {
    relation: activo.id,
    host_asociado: activo.hostname,
    ip_asociada: activo.ip,
    puertos_abiertos: JSON.stringify(puertosAbiertos),
    password_default: passDefaultDetectada,
    firmware: firmaDetectada,
    vulnerabilidades: JSON.stringify(vulnerabilidades),
    estado_conexion: "Online",
    score: nuevoScore
  };

  try {
    const existente = await pb.collection('evaluaciones_red').getFirstListItem(`relation="${activo.id}"`);
    await pb.collection('evaluaciones_red').update(existente.id, payloadEvaluacionRed);
  } catch (e) {
    try {
      await pb.collection('evaluaciones_red').create(payloadEvaluacionRed);
    } catch (createErr) {
      console.error(`Error guardando en PocketBase para ${activo.hostname}:`, createErr.message);
    }
  }

  console.log(`[AUDITORÍA FINALIZADA] ${activo.hostname} (${activo.tipo}) -> Score: ${nuevoScore}/100`);
}

// Reset inicial de todas las banderas pendientes en la base de datos
async function limpiarSolicitudesPendientes() {
  try {
    const activos = await pb.collection('activos').getFullList();
    let reseteados = 0;
    for (const activo of activos) {
      if (activo.forzar_escaneo_manual) {
        await pb.collection('activos').update(activo.id, { forzar_escaneo_manual: false });
        reseteados++;
      }
    }
    if (reseteados > 0) {
      console.log(`[INICIO] Se limpiaron ${reseteados} banderas residuales de re-escaneo.`);
    }
  } catch (err) {
    console.error('Error limpiando solicitudes pendientes:', err.message);
  }
}

// Suscripción Realtime para re-escaneos manuales instantáneos
async function iniciarSuscripcionRealtime() {
  if (suscripcionRealtimeActiva) return;

  try {
    await pb.collection('activos').subscribe('*', async (e) => {
      // 1. LOG DE DIAGNÓSTICO: Muestra todo evento que llega a Node.js
      if (e.action === 'update' && e.record) {
        console.log(`[REALTIME RECIBIDO] Activo: ${e.record.hostname} | Flag: ${e.record.forzar_escaneo_manual} (${typeof e.record.forzar_escaneo_manual}) | Tipo: ${e.record.tipo}`);
      }

      // 2. EVALUACIÓN FLEXIBLE: Acepta boolean true y string "true"
      const esSolicitudManual = e.action === 'update' && 
        (e.record.forzar_escaneo_manual === true || String(e.record.forzar_escaneo_manual).toLowerCase() === 'true');

      if (esSolicitudManual) {
        const tipoNormalizado = (e.record.tipo || '').toLowerCase();
        
        if (tipoNormalizado === 'servidor' || tipoNormalizado === 'nvr') {
          const assetId = e.record.id;

          if (activosEnAuditoria.has(assetId)) {
            console.log(`[REALTIME OMITE] ${e.record.hostname} ya está en proceso de auditoría.`);
            return;
          }

          activosEnAuditoria.add(assetId);
          console.log(`\n[REALTIME EVENT] Solicitud de re-escaneo recibida para: ${e.record.hostname}`);

          try {
            await auditarActivoIndividual(e.record);
          } catch (err) {
            console.error(`Error durante el re-escaneo manual de ${e.record.hostname}:`, err.message);
          } finally {
            activosEnAuditoria.delete(assetId);
          }
        } else {
          console.log(`[REALTIME IGNORED] Tipo de activo no sujeto a auditoría automática: ${e.record.tipo}`);
        }
      }
    });

    suscripcionRealtimeActiva = true;
    console.log('[REALTIME] Escuchando solicitudes de re-escaneo manual para Servidores/NVRs...');
  } catch (err) {
    console.error('Error suscribiendo a Realtime:', err.message);
  }
}

// Ciclo principal de auditoría programada
async function cicloAuditoriaRed() {
  try {
    await pb.collection('_superusers').authWithPassword('prueba@prueba.com', 'Admin12345');

    // 1. Limpiar cualquier estado previo atascado en PocketBase
    await limpiarSolicitudesPendientes();

    // 2. Encender escucha Realtime
    await iniciarSuscripcionRealtime();
  } catch (authErr) {
    console.error('Error de autenticación en PocketBase:', authErr.message);
    setTimeout(cicloAuditoriaRed, 30000);
    return;
  }

  try {
    const activos = await pb.collection('activos').getFullList({
      filter: 'tipo = "Servidor" || tipo = "NVR"'
    });

    console.log(`[AUDITORÍA PROGRAMADA] Iniciando análisis de ${activos.length} activos...`);

    for (const activo of activos) {
      await auditarActivoIndividual(activo);
    }

  } catch (err) {
    console.error('Error durante el ciclo de auditoría:', err.message);
  }

  setTimeout(cicloAuditoriaRed, 3600000); // 1 hora
}

cicloAuditoriaRed();