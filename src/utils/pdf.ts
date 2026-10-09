import { qrUrlForActivo } from './qr';

function esc(v: any): string {
	return String(v ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
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
	const qrUrl = qrUrlForActivo(activo);
	const score = Number(activo.score_seguridad ?? activo.score ?? 0);
	const scoreLabel = score >= 80 ? 'Óptimo' : score >= 50 ? 'Riesgo' : 'Crítico';
	const scoreColor = score >= 80 ? '#1d7484' : score >= 50 ? '#d97706' : '#dc2626';

	const esPC = (activo.tipo || '').toUpperCase() === 'PC' || !activo.tipo;
	const esLinux = activo.hostname?.toLowerCase().includes('kali') || 
                  activo.tipo_so?.toLowerCase().includes('linux') ||
                  evaluacionEndpoint?.so?.toLowerCase().includes('linux');
	const nombreCifrado = esLinux ? 'LUKS' : 'BitLocker';

	// RENDER CONDICIONAL DE POSTURA DE SEGURIDAD
	let posturaRowsHtml = '';

	if (esPC) {
		// --- VISTA EXCLUSIVA PARA PCs (DATOS DE ENDPOINT) ---
		const bitlocker = evaluacionEndpoint
			? (evaluacionEndpoint.bitlocker_activo ? 'ON' : 'OFF')
			: '-';

		const edr = evaluacionEndpoint
			? (evaluacionEndpoint.edr_activo 
					? `Activo (${evaluacionEndpoint.edr_version || evaluacionEndpoint.edr_Version || 'Defender'})` 
					: 'Inactivo')
			: '-';

		const parches = evaluacionEndpoint
			? (evaluacionEndpoint.parches_so_al_dia ? 'Al día' : 'Pendientes')
			: '-';

		const admins = evaluacionEndpoint
			? (evaluacionEndpoint.admin_locales_lista || evaluacionEndpoint.admin_locales || 'Ninguno')
			: '-';

		posturaRowsHtml = `
			<tr><th>Cifrado (${esc(nombreCifrado)})</th><td>${esc(bitlocker)}</td></tr>
			<tr><th>EDR / Antivirus</th><td>${esc(edr)}</td></tr>
			<tr><th>Parches SO</th><td>${esc(parches)}</td></tr>
			<tr><th>Admins Locales</th><td>${esc(admins)}</td></tr>
		`;
	} else {
		// --- VISTA EXCLUSIVA PARA SERVIDORES Y NVRs (DATOS DE RED) ---
		const passDefault = evaluacionRed
			? (evaluacionRed.password_default ? 'Riesgo (Default)' : 'Segura / Cambiada')
			: '-';

		let puertosStr = '-';
		if (evaluacionRed) {
			const rawPuertos = evaluacionRed.puertos_abiertos ?? evaluacionRed.Puertos_Abiertos;
			if (Array.isArray(rawPuertos) && rawPuertos.length > 0) {
				puertosStr = rawPuertos.join(', ');
			} else if (typeof rawPuertos === 'string' && rawPuertos.trim() !== '') {
				puertosStr = rawPuertos;
			}
		}

		const firmware = evaluacionRed
			? (evaluacionRed.firmware || (evaluacionRed.firmware_actualizado ? 'Actualizado' : 'Desactualizado'))
			: '-';

		posturaRowsHtml = `
			<tr><th>Password Default</th><td>${esc(passDefault)}</td></tr>
			<tr><th>Puertos Abiertos</th><td>${esc(puertosStr)}</td></tr>
			<tr><th>Firmware / Firma</th><td>${esc(firmware)}</td></tr>
		`;
	}

	const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)} - ${esc(activo.hostname)}</title>
	<style>
		* { box-sizing: border-box; }
		body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; margin: 0; color: #1e293b; background: #fff; }
		.header { background: #0f172a; color: #fff; padding: 20px 32px; border-bottom: 4px solid #f59e0b; display: flex; justify-content: space-between; align-items: center; }
		.header h1 { margin: 0; font-size: 18px; letter-spacing: 0.02em; }
		.header .sub { font-size: 11px; color: #38bdf8; margin-top: 2px; }
		.badge { background: #f59e0b; color: #0f172a; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
		.container { padding: 24px 32px; }
		h2 { font-size: 14px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 18px 0 10px; }
		table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 12px; }
		td, th { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
		th { background: #f8fafc; color: #334155; width: 32%; font-weight: 600; }
		.grid { display: flex; gap: 18px; }
		.grid .col { flex: 1; }
		.qr { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; background: #fff; }
		.qr img { width: 140px; height: 140px; image-rendering: pixelated; margin: 0 auto; display: block; }
		.muted { color: #64748b; font-size: 11px; }
		.score { display: inline-block; padding: 2px 8px; border-radius: 12px; color: #fff; font-weight: 700; background: ${scoreColor}; }
		.sign { margin-top: 48px; display: flex; justify-content: space-between; gap: 24px; }
		.sign div { border-top: 1px solid #0f172a; width: 45%; text-align: center; padding-top: 6px; font-size: 11px; }
		.footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
		.no-print { text-align: center; margin-top: 18px; }
		@media print { .no-print { display: none; } @page { size: A4 landscape; margin: 10mm; } }
	</style></head><body>
	<div class="header">
		<div>
			<h1>SecurAsset <span style="color:#f59e0b">•</span> ${esc(titulo)}</h1>
			<div class="sub">Inventario &amp; Postura de Seguridad</div>
		</div>
		<div class="badge">${esc(titulo)}</div>
	</div>
	<div class="container">
		<p class="muted">Fecha: ${esc(fecha)} &nbsp;|&nbsp; ID: ${esc(activo.id)} &nbsp;|&nbsp; Generado por Inventario-Seguridad</p>
		<div class="grid">
			<div class="col">
				<h2>Ficha Técnica</h2>
				<table><tbody>
					<tr><th>Hostname</th><td><b>${esc(activo.hostname)}</b></td></tr>
					<tr><th>Tipo</th><td>${esc(activo.tipo || 'PC')}</td></tr>
					<tr><th>IP / MAC</th><td>${esc(activo.ip)} / ${esc(activo.mac)}</td></tr>
					<tr><th>N° Serie</th><td>${esc(activo.n_serie || 'SN-' + (activo.mac || '').replaceAll(':', '').toUpperCase())}</td></tr>
					<tr><th>Ubicación</th><td>${esc(activo.ubicacion || 'Sede Central')}</td></tr>
					<tr><th>Responsable</th><td>${esc(activo.responsable || 'Sin Asignar')}</td></tr>
					<tr><th>Ciclo de vida</th><td>${esc(activo.estado_ciclo || 'Operativo')}</td></tr>
					<tr><th>Score Seguridad</th><td><span class="score">${score}/100 ${esc(scoreLabel)}</span></td></tr>
				</tbody></table>

				<h2>Postura de Seguridad (${esPC ? 'Endpoint' : 'Auditoría de Red'})</h2>
				<table><tbody>
					${posturaRowsHtml}
				</tbody></table>
			</div>

			<div class="col" style="max-width:220px">
				<div class="qr">
					<div style="font-size:10px; font-weight:700; color:#0f172a; margin-bottom:6px">ETIQUETA QR — INVENTARIO FÍSICO</div>
					<img src="${qrUrl}" alt="QR ${esc(activo.hostname)}" />
					<div class="muted" style="margin-top:6px; font-family:monospace">${esc(activo.id)}</div>
					<div class="muted">${esc(activo.hostname)}</div>
				</div>
				<div style="margin-top:12px; background:#f8fafc; border-left:3px solid #f59e0b; padding:8px 10px; font-size:11px">
					<b style="color:#0f172a">Acta inmutable</b> <span class="muted">— ID trazable por QR. Verificar en dashboard.</span>
				</div>
			</div>
		</div>

		<p style="font-size:11px; margin-top:14px">Se hace entrega/devolución del activo descrito bajo responsabilidad de <b>${esc(activo.responsable || 'Asignado Manualmente')}</b> conforme a políticas de seguridad.</p>

		<div class="sign">
			<div>Entrega TI / Ciberseguridad<br><span class="muted">Firma / Fecha</span></div>
			<div>Recibe (${esc(activo.responsable || 'Encargado')})<br><span class="muted">Firma / Fecha</span></div>
		</div>

		<div class="footer">
			<span>SecurAsset • ${esc(fecha)} • ID ${esc(activo.id)}</span>
			<span>Pág. 1/1</span>
		</div>

		<div class="no-print">
			<button onclick="window.print()" style="background:#f59e0b; color:#0f172a; border:none; padding:10px 18px; border-radius:6px; font-weight:700; cursor:pointer">Imprimir / Guardar PDF</button>
			<button onclick="window.close()" style="margin-left:8px; background:#e2e8f0; color:#0f172a; border:1px solid #cbd5e1; padding:10px 18px; border-radius:6px; cursor:pointer">Cerrar</button>
		</div>
	</div>
	</body></html>`;

	try {
		const blob = new Blob([html], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const w = window.open(url, '_blank');
		if (!w) throw new Error('popup_blocked');
		setTimeout(() => URL.revokeObjectURL(url), 60000);
	} catch (e) {
		// Fallback iframe
		const iframe = document.createElement('iframe');
		iframe.style.position = 'fixed';
		iframe.style.right = '0';
		iframe.style.bottom = '0';
		iframe.style.width = '0';
		iframe.style.height = '0';
		iframe.style.border = '0';
		document.body.appendChild(iframe);
		const doc = iframe.contentWindow?.document;
		if (doc) {
			doc.open();
			doc.write(html);
			doc.close();
		}
	}
}