import qrcode from 'qrcode-generator';

export function qrPayloadForActivo(activo: { id: string }): string {
	const envBase =
		(import.meta as any).env?.VITE_QR_BASE_URL ||
		(import.meta as any).env?.PUBLIC_QR_BASE_URL ||
		'';
	if (envBase) return `${envBase.replace(/\/$/, '')}/qr/${activo.id}`;
	
	const base =
		typeof window !== 'undefined' && window.location?.origin
			? window.location.origin
			: 'http://127.0.0.1:5173';
	return `${base}/qr/${activo.id}`;
}

export function qrDataUrlForActivo(
	activo: { id: string },
	cellSize = 6,
	margin = 0
): string {
	try {
		const payload = qrPayloadForActivo(activo);
		if (!payload || !activo.id) return '';
		const qr = qrcode(0, 'M');
		qr.addData(payload);
		qr.make();
		return qr.createDataURL(cellSize, margin);
	} catch (e) {
		console.error('[QR] fallo en generación offline', e);
		return '';
	}
}

export function qrUrlForActivo(activo: { id: string }): string {
	return qrDataUrlForActivo(activo);
}