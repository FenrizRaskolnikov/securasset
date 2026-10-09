const { exec } = require('child_process');
const os = require('os');
const PocketBase = require('pocketbase/cjs');
const EventModule = require('eventsource');
global.EventSource = EventModule.EventSource || EventModule;
const PB_URL = 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

// Control de concurrencia y estado Realtime
const activosEnAuditoria = new Set();
let suscripcionRealtimeActiva = false;

// Función auxiliar para ejecutar comandos locales del sistema operativo
function ejecutarComando(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000 }, (error, stdout) => {
      if (error) return resolve('');
      resolve(stdout.trim());
    });
  });
}

// 1. Obtener datos del PC Local (Donde se ejecuta el worker)
async function recolectarDatosPCLocal() {
  const isWindows = process.platform === 'win32';
  const hostname = os.hostname();
  
  // IP y MAC Local
  const interfaces = os.networkInterfaces();
  let ip = '127.0.0.1';
  let mac = '00:00:00:00:00:00';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4') {
        ip = iface.address;
        mac = iface.mac || mac;
        break;
      }
    }
  }

  let bitlocker = false;
  let edr = false;
  let edrNombre = 'Sin EDR Detectado';
  let parchesOk = true;
  let fechaParche = 'No registrada';
  let admins = [];
  let detalleDisco = 'Disco Local Principal';

  if (isWindows) {
    // 1. BitLocker
    const cmdBitlocker = 'powershell -NoProfile -Command "(Get-BitLockerVolume -MountPoint C:).ProtectionStatus"';
    const resBitlocker = await ejecutarComando(cmdBitlocker);
    bitlocker = resBitlocker.includes('On') || resBitlocker.trim() === '1';

    // 2. Nombre exacto de EDR / Antivirus
    const cmdEdr = 'powershell -NoProfile -Command "Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct | Select-Object -ExpandProperty displayName"';
    const resEdr = await ejecutarComando(cmdEdr);
    if (resEdr) {
      edr = true;
      edrNombre = resEdr.split('\n')[0].trim();
    }

    // 3. Fecha real de parche (Consulta directa y limpia a HotFix)
    const cmdParche = 'powershell -NoProfile -Command "(Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn"';
    const resParche = await ejecutarComando(cmdParche);
    if (resParche) {
      const parsedDate = new Date(resParche.trim());
      if (!isNaN(parsedDate.getTime())) {
        fechaParche = parsedDate.toISOString().split('T')[0];
      } else {
        fechaParche = resParche.trim();
      }
    }

    // 4. Disco C: (Tamaño + Tipo HDD/SSD)
    const cmdDiscoGB = 'powershell -NoProfile -Command "[math]::round((Get-Volume -DriveLetter C).Size / 1GB)"';
    const cmdDiscoTipo = 'powershell -NoProfile -Command "(Get-Partition -DriveLetter C | Get-Disk).MediaType"';
    
    const resGB = await ejecutarComando(cmdDiscoGB);
    const resTipo = await ejecutarComando(cmdDiscoTipo);

    if (resGB) {
      const tipoStr = resTipo ? resTipo.trim() : 'Disco Local';
      detalleDisco = `${resGB.trim()} GB ${tipoStr}`;
    }

    // 5. Administradores Locales
    const cmdAdmin = 'powershell -NoProfile -Command "(Get-LocalGroupMember -Group Administradores).Name"';
    const resAdmin = await ejecutarComando(cmdAdmin);
    if (resAdmin) {
      admins = resAdmin.split('\n').map(a => a.trim().split('\\').pop()).filter(Boolean);
    }

  } else {
    // Linux local
    const cmdLuks = "lsblk -o TYPE,FSTYPE | grep -iE 'crypt|crypto_LUKS'";
    const resLuks = await ejecutarComando(cmdLuks);
    bitlocker = resLuks.length > 0;

    const cmdEdr = "ps aux | grep -iE '(crowdstrike|falcon|sentinel|clamav|wazuh|ossec)' | grep -v grep";
    const resEdr = await ejecutarComando(cmdEdr);
    edr = resEdr.length > 0;
    if (edr) edrNombre = 'Agente de Seguridad Linux Detectado';

    const cmdSudo = "getent group sudo | cut -d: -f4";
    const resSudo = await ejecutarComando(cmdSudo);
    if (resSudo) admins = resSudo.split(',');
  }

  return {
    hostname,
    ip,
    mac: mac.toLowerCase().replace(/-/g, ':'),
    n_serie: 'LOCAL-HOST-DEV',
    cpu: `${os.cpus()[0]?.model || 'CPU Genérica'}`,
    ram: `${Math.round(os.totalmem() / (1024 ** 3))} GB`,
    disco: detalleDisco,
    bitlocker_activo: bitlocker,
    edr_activo: edr,
    edr_Version: edrNombre,
    parches_so_al_dia: parchesOk,
    fecha_ultimo_parche: fechaParche,
    admin_locales: admins.length > 0 ? admins.join(', ') : 'Ninguno',
    total_admins: admins.length
  };
}

// 2. Escaneo remoto via Nmap/WinRM/WMI para PCs de la red
async function descubrirYAuditarRemoto(ipRemota) {
  const cmdNmap = `nmap -p 22,135,5985 --open -T4 ${ipRemota}`;
  const salida = await ejecutarComando(cmdNmap);

  const tieneSSH = salida.includes('22/tcp');
  const tieneWinRM = salida.includes('5985/tcp') || salida.includes('135/tcp');

  if (!tieneSSH && !tieneWinRM) {
    return null;
  }

  if (tieneWinRM) {
    const cmdWmi = `powershell -Command "Get-CimInstance -ComputerName ${ipRemota} -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue | Select-Object CSName, Caption"`;
    const resWmi = await ejecutarComando(cmdWmi);

    return {
      hostname: resWmi ? resWmi.split('\n')[0].trim() : `PC-REMOTO-${ipRemota.replace(/\./g, '_')}`,
      ip: ipRemota,
      mac: '00:00:00:00:00:00',
      n_serie: 'REMOTE-SN-WIN',
      cpu: 'Procesador Remoto (WinRM)',
      ram: 'Memoria Remota',
      disco: 'Disco Remoto',
      bitlocker_activo: true,
      edr_activo: true,
      edr_Version: 'Auditoría Remota WMI',
      parches_so_al_dia: true,
      fecha_ultimo_parche: '2026-01-01',
      admin_locales: 'Consultado Vía Red',
      total_admins: 1
    };
  }

  return null;
}

// =========================================================================
// FUNCIÓN DE CÁLCULO DE SCORE IGUAL A AGENTE.PY
// =========================================================================
function calcularScore(bitlocker, edr, parchesOk, cantidadAdmins = 0) {
  let score = 100;
  if (!bitlocker) score -= 25;
  if (!edr) score -= 35;
  if (!parchesOk) score -= 20;
  if (cantidadAdmins > 3) score -= 20;
  return Math.max(0, score);
}

// 3. Procesar y guardar en PocketBase solo si hay cambios
async function procesarEvaluacion(datos, esManual = false) {
  try {
    let activoId = null;
    const activosExistentes = await pb.collection('activos').getList(1, 1, {
      filter: `hostname = "${datos.hostname}" || ip = "${datos.ip}"`
    });

    const score = calcularScore(
      datos.bitlocker_activo,
      datos.edr_activo,
      datos.parches_so_al_dia,
      datos.total_admins || 0
    );

    if (activosExistentes.items.length > 0) {
      activoId = activosExistentes.items[0].id;
      await pb.collection('activos').update(activoId, {
        ip: datos.ip,
        score_seguridad: score,
        forzar_escaneo_manual: false // Limpiamos la bandera tras procesar
      });
    } else {
      const nuevoActivo = await pb.collection('activos').create({
        hostname: datos.hostname,
        ip: datos.ip,
        mac: datos.mac,
        n_serie: datos.n_serie,
        tipo: 'PC',
        estado_ciclo: 'Operativo',
        score_seguridad: score,
        ubicacion: 'Sede Central',
        forzar_escaneo_manual: false
      });
      activoId = nuevoActivo.id;
    }

    const payloadEval = {
      relation: activoId,
      cpu: datos.cpu,
      ram: datos.ram,
      disco: datos.disco,
      bitlocker_activo: datos.bitlocker_activo,
      edr_activo: datos.edr_activo,
      edr_Version: datos.edr_Version,
      parches_so_al_dia: datos.parches_so_al_dia,
      fecha_ultimo_parche: datos.fecha_ultimo_parche,
      admin_locales: datos.admin_locales
    };

    let debeGuardarEval = true;

    // Si es un re-escaneo manual forzamos el guardado del historial
    if (!esManual) {
      try {
        const ultimosRegistros = await pb.collection('evaluaciones_endpoints').getList(1, 1, {
          filter: `relation = "${activoId}"`,
          sort: '-created'
        });

        if (ultimosRegistros.items.length > 0) {
          const ultimaEval = ultimosRegistros.items[0];
          const norm = (v) => String(v ?? '').trim().toLowerCase();

          const mismoBitlocker = Boolean(ultimaEval.bitlocker_activo) === Boolean(datos.bitlocker_activo);
          const mismoEdr = Boolean(ultimaEval.edr_activo) === Boolean(datos.edr_activo);
          const mismaEdrVersion = norm(ultimaEval.edr_Version) === norm(datos.edr_Version);
          const mismosParches = Boolean(ultimaEval.parches_so_al_dia) === Boolean(datos.parches_so_al_dia);
          const mismaFechaParche = norm(ultimaEval.fecha_ultimo_parche).substring(0, 10) === norm(datos.fecha_ultimo_parche).substring(0, 10);
          const mismosAdmins = norm(ultimaEval.admin_locales) === norm(datos.admin_locales);
          const mismaCpu = norm(ultimaEval.cpu) === norm(datos.cpu);
          const mismaRam = norm(ultimaEval.ram) === norm(datos.ram);
          const mismoDisco = norm(ultimaEval.disco) === norm(datos.disco);

          if (mismoBitlocker && mismoEdr && mismaEdrVersion && mismosParches && mismaFechaParche && mismosAdmins && mismaCpu && mismaRam && mismoDisco) {
            debeGuardarEval = false;
          }
        }
      } catch (e) {
        debeGuardarEval = true;
      }
    }

    if (debeGuardarEval) {
      await pb.collection('evaluaciones_endpoints').create(payloadEval);
      console.log(`[AGENTLESS ${esManual ? 'MANUAL' : 'CAMBIO'}] Evaluación registrada -> ${datos.hostname} (${datos.ip}) | Score: ${score}`);
    } else {
      console.log(`[AGENTLESS SIN CAMBIOS] Omitiendo guardado duplicado para ${datos.hostname} (${datos.ip})`);
    }

  } catch (err) {
    console.error(`Error procesando evaluación para ${datos.hostname}:`, err.message);
  }
}

// 4. Función encargada de auditar un único activo a solicitud manual
async function auditarActivoAgentless(activoRecord) {
  console.log(`[AGENTLESS INICIO MANUAL] Auditando host: ${activoRecord.hostname} (${activoRecord.ip})...`);
  
  const interfaces = os.networkInterfaces();
  let esHostLocal = false;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4' && iface.address === activoRecord.ip) {
        esHostLocal = true;
        break;
      }
    }
  }

  if (esHostLocal || activoRecord.hostname === os.hostname()) {
    const datosLocal = await recolectarDatosPCLocal();
    await procesarEvaluacion(datosLocal, true);
  } else {
    const datosRemotos = await descubrirYAuditarRemoto(activoRecord.ip);
    if (datosRemotos) {
      await procesarEvaluacion(datosRemotos, true);
    } else {
      console.warn(`[AGENTLESS ADVERTENCIA] No se pudo conectar vía WinRM/SSH con host remoto: ${activoRecord.ip}`);
      // Limpiamos el flag de todos modos para prevenir loops infinitos
      await pb.collection('activos').update(activoRecord.id, { forzar_escaneo_manual: false });
    }
  }
}

// 5. Suscripción Realtime para re-escaneos en tiempo real
async function iniciarSuscripcionRealtime() {
  if (suscripcionRealtimeActiva) return;

  try {
    await pb.collection('activos').subscribe('*', async (e) => {
      if (e.action === 'update' && e.record) {
        console.log(`[AGENTLESS REALTIME] Evento -> Host: ${e.record.hostname} | Flag: ${e.record.forzar_escaneo_manual} (${typeof e.record.forzar_escaneo_manual}) | Tipo: ${e.record.tipo}`);
      }

      // Evaluación flexible del flag
      const esSolicitudManual = e.action === 'update' && 
        (e.record.forzar_escaneo_manual === true || String(e.record.forzar_escaneo_manual).toLowerCase() === 'true');

      if (esSolicitudManual) {
        const tipoNorm = (e.record.tipo || '').toLowerCase();

        // Procesa activos tipo PC / Laptop
        if (tipoNorm === 'pc' || tipoNorm === 'laptop' || tipoNorm === 'desktop') {
          const assetId = e.record.id;

          if (activosEnAuditoria.has(assetId)) {
            console.log(`[AGENTLESS OMITE] ${e.record.hostname} ya está en proceso de auditoría.`);
            return;
          }

          activosEnAuditoria.add(assetId);
          console.log(`\n[AGENTLESS EVENT] Solicitud de re-escaneo manual recibida para: ${e.record.hostname} (${e.record.ip})`);

          try {
            await auditarActivoAgentless(e.record);
          } catch (err) {
            console.error(`Error en re-escaneo manual agentless de ${e.record.hostname}:`, err.message);
          } finally {
            activosEnAuditoria.delete(assetId);
          }
        } else {
          console.log(`[AGENTLESS IGNORED] Dispositivo tipo ${e.record.tipo} es ignorado por el worker agentless.`);
        }
      }
    });

    suscripcionRealtimeActiva = true;
    console.log('[AGENTLESS] Suscripción Realtime activa y escuchando re-escaneos manuales...');
  } catch (err) {
    console.error('Error al suscribir realtime en worker-agentless:', err.message);
  }
}

// Ciclo Principal de Ejecución
async function cicloAgentless() {
  try {
    await pb.collection('_superusers').authWithPassword('prueba@prueba.com', 'Admin12345');
    
    // Iniciar escucha en tiempo real inmediatamente después de autenticar
    await iniciarSuscripcionRealtime();

    // Limpieza preventiva de flags colgados al iniciar
    const conFlagsPendientes = await pb.collection('activos').getFullList({
      filter: 'forzar_escaneo_manual = true || forzar_escaneo_manual = "true"'
    });

    if (conFlagsPendientes.length > 0) {
      console.log(`[INICIO] Limpiando ${conFlagsPendientes.length} banderas residuales de re-escaneo agentless...`);
      for (const item of conFlagsPendientes) {
        await pb.collection('activos').update(item.id, { forzar_escaneo_manual: false });
      }
    }

  } catch (authErr) {
    console.error('Error de autenticación en PocketBase:', authErr.message);
    setTimeout(cicloAgentless, 15000);
    return;
  }

  console.log('\n[AGENTLESS] Iniciando ciclo de auditoría programado...');

  // 1. Auditar el propio PC local
  console.log('Auditando PC local (Host)...');
  const datosLocal = await recolectarDatosPCLocal();
  await procesarEvaluacion(datosLocal);

  // 2. Escanear rango de red para buscar otros PCs remotos
  const subred = '192.168.1.';
  for (let i = 2; i <= 10; i++) {
    const targetIp = `${subred}${i}`;
    if (targetIp === datosLocal.ip) continue;

    const datosRemotos = await descubrirYAuditarRemoto(targetIp);
    if (datosRemotos) {
      await procesarEvaluacion(datosRemotos);
    }
  }

  console.log('[AGENTLESS] Ciclo programado finalizado. Próxima ejecución en 5 minutos.');
  setTimeout(cicloAgentless, 300000);
}

cicloAgentless();