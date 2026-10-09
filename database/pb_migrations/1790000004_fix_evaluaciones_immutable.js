/// <reference path="../pb_data/types.d.ts" />
// RNF-01 — Inmutabilidad: evaluaciones solo insert/lectura, update/delete null (solo superuser)
migrate(
	(app) => {
		// Endpoints inmutable — solo auth puede listar/ver/crear
		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.listRule = '@request.auth.id != ""';
		ep.viewRule = '@request.auth.id != ""';
		ep.createRule = '@request.auth.id != ""';
		ep.updateRule = null; // null = solo superuser, '' = cualquier auth (vulnerable)
		ep.deleteRule = null;
		app.save(ep);

		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.listRule = '@request.auth.id != ""';
		red.viewRule = '@request.auth.id != ""';
		red.createRule = '@request.auth.id != ""';
		red.updateRule = null;
		red.deleteRule = null;
		app.save(red);

		// shadow_it ya es mutable a propósito (CU-06 Aprobar/Ignorar/Eliminar) — no tocar inmutabilidad
		// pero asegurar que siga con reglas auth (idempotente)
		const shadow = app.findCollectionByNameOrId('pbc_2297327307');
		shadow.listRule = '@request.auth.id != ""';
		shadow.viewRule = '@request.auth.id != ""';
		shadow.createRule = '@request.auth.id != ""';
		shadow.updateRule = '@request.auth.id != ""';
		shadow.deleteRule = '@request.auth.id != ""';
		app.save(shadow);

		// activos CRUD completo para CU-01 (operador TI gestiona fichas)
		const activos = app.findCollectionByNameOrId('pbc_1231947254');
		activos.listRule = '@request.auth.id != ""';
		activos.viewRule = '@request.auth.id != ""';
		activos.createRule = '@request.auth.id != ""';
		activos.updateRule = '@request.auth.id != ""';
		activos.deleteRule = '@request.auth.id != ""';
		app.save(activos);

		return;
	},
	(app) => {
		// rollback: restaurar estado previo 1790000003 (evaluaciones con update/delete = '' abierto)
		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.createRule = '@request.auth.id != ""';
		ep.updateRule = '';
		ep.deleteRule = '';
		ep.listRule = '@request.auth.id != ""';
		ep.viewRule = '@request.auth.id != ""';
		app.save(ep);

		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.createRule = '@request.auth.id != ""';
		red.updateRule = '';
		red.deleteRule = '';
		red.listRule = '@request.auth.id != ""';
		red.viewRule = '@request.auth.id != ""';
		app.save(red);

		return;
	}
);
