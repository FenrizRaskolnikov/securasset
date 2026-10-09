import qrcode from 'qrcode-generator';

function esc(v: any): string {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function generarQrLocal(activo: { id: string }): string {
    try {
        let base = 'http://127.0.0.1:5173';
        if (typeof window !== 'undefined' && window.location) {
            base = `${window.location.protocol}//${window.location.host}`;
        }
        const payload = `${base}/?ver=${activo.id}`;
        const qr = qrcode(0, 'M');
        qr.addData(payload);
        qr.make();
        return qr.createDataURL(6, 0);
    } catch (e) {
        return '';
    }
}

export function generarActaPdf(
    activo: any,
    tipoActa: 'entrega' | 'devolucion' = 'entrega',
    evaluacionEndpoint?: any | null,
    evaluacionRed?: any | null
) {
    if (!activo) return;

    const fecha = new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const titulo = tipoActa === 'entrega' ? 'Acta de Entrega' : 'Acta de Devolución';
    const qrUrl = generarQrLocal(activo);
    const score = Number(activo.score_seguridad ?? activo.score ?? 100);
    const scoreLabel = score >= 80 ? 'Óptimo' : score >= 50 ? 'Riesgo' : 'Crítico';
    const scoreColor = score >= 80 ? '#1d7484' : score >= 50 ? '#d97706' : '#dc2626';

    const tipoActivoUpper = (activo.tipo || '').toUpperCase();
    const esPC = tipoActivoUpper === 'PC' || !activo.tipo;
    const esServidorONvr = tipoActivoUpper === 'SERVIDOR' || tipoActivoUpper === 'NVR';

    const esLinux = activo.hostname?.toLowerCase().includes('kali') || 
                  activo.tipo_so?.toLowerCase().includes('linux') ||
                  evaluacionEndpoint?.so?.toLowerCase().includes('linux');
    const nombreCifrado = esLinux ? 'LUKS' : 'BitLocker';

    const cpuVal = evaluacionEndpoint?.cpu || activo.cpu || 'No registrado';
    const ramVal = evaluacionEndpoint?.ram || activo.ram || 'No registrado';
    const discoVal = evaluacionEndpoint?.disco || activo.disco || 'No registrado';

    let posturaRowsHtml = '';

    if (esPC) {
        const bitlocker = evaluacionEndpoint ? (evaluacionEndpoint.bitlocker_activo ? 'ON' : 'OFF') : '-';
        const edr = evaluacionEndpoint ? (evaluacionEndpoint.edr_activo ? `Activo (${evaluacionEndpoint.edr_version || evaluacionEndpoint.edr_Version || 'Defender'})` : 'Inactivo') : '-';
        const parches = evaluacionEndpoint ? (evaluacionEndpoint.parches_so_al_dia ? 'Al día' : 'Pendientes') : '-';
        
        let admins = '-';
        if (evaluacionEndpoint) {
            if (evaluacionEndpoint.admin_locales_lista) {
                admins = evaluacionEndpoint.admin_locales_lista;
            } else if (evaluacionEndpoint.admin_locales) {
                admins = String(evaluacionEndpoint.admin_locales);
            }
        }

        posturaRowsHtml = `
            <tr><th>Cifrado (${esc(nombreCifrado)})</th><td>${esc(bitlocker)}</td></tr>
            <tr><th>EDR / Antivirus</th><td>${esc(edr)}</td></tr>
            <tr><th>Parches SO</th><td>${esc(parches)}</td></tr>
            <tr><th>Admins Locales</th><td>${esc(admins)}</td></tr>
        `;
    } else {
        // --- SERVIDORES Y NVRs --- (Validación leyendo el array de vulnerabilidades)
        let passDefault = 'Segura / Cambiada';
        if (evaluacionRed) {
            let listaVuls: string[] = [];
            if (Array.isArray(evaluacionRed.vulnerabilidades)) {
                listaVuls = evaluacionRed.vulnerabilidades;
            } else if (typeof evaluacionRed.vulnerabilidades === 'string') {
                try {
                    listaVuls = JSON.parse(evaluacionRed.vulnerabilidades);
                } catch {
                    listaVuls = [evaluacionRed.vulnerabilidades];
                }
            }

            const tienePassDefault = listaVuls.some(v => 
                v.toLowerCase().includes('contraseña') || 
                v.toLowerCase().includes('password') || 
                v.toLowerCase().includes('defecto')
            );

            passDefault = tienePassDefault ? 'Riesgo (Default)' : 'Segura / Cambiada';
        }
        
        let puertosStr = '-';
        if (evaluacionRed?.puertos_abiertos) {
            const rawPuertos = evaluacionRed.puertos_abiertos;
            if (Array.isArray(rawPuertos)) {
                puertosStr = rawPuertos.join(', ');
            } else {
                try {
                    const parsed = JSON.parse(rawPuertos);
                    puertosStr = Array.isArray(parsed) ? parsed.join(', ') : String(rawPuertos);
                } catch {
                    puertosStr = String(rawPuertos);
                }
            }
        }

        const firmware = evaluacionRed?.firmware || 'No identificado';

        posturaRowsHtml = `
            <tr><th>Password Default</th><td>${esc(passDefault)}</td></tr>
            <tr><th>Puertos Abiertos</th><td>${esc(puertosStr)}</td></tr>
            <tr><th>Firmware / Firma</th><td>${esc(firmware)}</td></tr>
        `;
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)} - ${esc(activo.hostname)}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; color: #1e293b; background: #fff; font-size: 12px; }
        .header { background: #0f172a; color: #fff; padding: 14px 24px; border-bottom: 3px solid #f59e0b; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 16px; }
        .container { padding: 16px 24px; }
        h2 { font-size: 13px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin: 12px 0 6px; }
        table { width: 100%; border-collapse: collapse; margin: 4px 0 10px; font-size: 11px; }
        td, th { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
        th { background: #f8fafc; color: #334155; width: 32%; font-weight: 600; }
        .grid { display: flex; gap: 16px; }
        .grid .col { flex: 1; }
        .qr { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #fff; }
        .qr img { width: 120px; height: 120px; image-rendering: pixelated; margin: 0 auto; display: block; }
        .score { display: inline-block; padding: 2px 6px; border-radius: 10px; color: #fff; font-weight: 700; background: ${scoreColor}; }
        .sign { margin-top: 28px; display: flex; justify-content: space-between; gap: 24px; }
        .sign div { border-top: 1px solid #0f172a; width: 45%; text-align: center; padding-top: 4px; font-size: 11px; }
        @media print { 
            .no-print { display: none; } 
            @page { size: A4 portrait; margin: 6mm; } 
        }
    </style></head><body>
    <div class="header">
        <div><h1>SecurAsset • ${esc(titulo)}</h1></div>
        <div style="background:#f59e0b; color:#0f172a; padding:3px 8px; border-radius:16px; font-weight:700; font-size:10px;">${esc(titulo)}</div>
    </div>
    <div class="container">
        <div class="grid">
            <div class="col">
                <h2>Ficha Técnica</h2>
                <table><tbody>
                    <tr><th>Hostname</th><td><b>${esc(activo.hostname)}</b></td></tr>
                    <tr><th>Tipo</th><td>${esc(activo.tipo || 'PC')}</td></tr>
                    <tr><th>IP / MAC</th><td>${esc(activo.ip)} / ${esc(activo.mac)}</td></tr>
                    ${!esServidorONvr ? `
                        <tr><th>Procesador (CPU)</th><td>${esc(cpuVal)}</td></tr>
                        <tr><th>Memoria RAM</th><td>${esc(ramVal)}</td></tr>
                        <tr><th>Almacenamiento</th><td>${esc(discoVal)}</td></tr>
                    ` : ''}
                    <tr><th>N° Serie</th><td>${esc(activo.n_serie || 'SN-' + (activo.mac || '').replaceAll(':', '').toUpperCase())}</td></tr>
                    <tr><th>Ubicación</th><td>${esc(activo.ubicacion || 'Sede Central')}</td></tr>
                    <tr><th>Responsable</th><td>${esc(activo.responsable || 'Sin Asignar')}</td></tr>
                    <tr><th>Ciclo de vida</th><td>${esc(activo.estado_ciclo || 'Operativo')}</td></tr>
                    <tr><th>Score Seguridad</th><td><span class="score">${score}/100 ${esc(scoreLabel)}</span></td></tr>
                </tbody></table>
                <h2>Postura de Seguridad (${esPC ? 'Endpoint' : 'Red'})</h2>
                <table><tbody>${posturaRowsHtml}</tbody></table>
            </div>
            <div class="col" style="max-width:200px">
                <div class="qr">
                    <img src="${qrUrl}" alt="QR" />
                    <div style="font-size:9px; font-family:monospace; margin-top:4px">${esc(activo.id)}</div>
                </div>
            </div>
        </div>
        <div class="sign">
            <div>Entrega TI<br><span>Firma / Fecha</span></div>
            <div>Recibe (${esc(activo.responsable || 'Encargado')})<br><span>Firma / Fecha</span></div>
        </div>
        <div class="no-print" style="text-align:center; margin-top:14px">
            <button onclick="window.print()" style="background:#f59e0b; color:#0f172a; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer">Imprimir PDF</button>
        </div>
    </div>
    </body></html>`;

    try {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (e) {
        console.error(e);
    }
}