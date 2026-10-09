/// <reference path="../pb_data/types.d.ts" />
// RF-05 — Ficha pública QR sin login: view público de activos + evaluaciones relacionadas
// Activos: viewRule="" (público), listRule sigue auth para no exponer inventario completo sin login
// Evaluaciones: view público para que la ficha pueda traer detalle sin token
migrate(
	(app) => {
		// activos view público — permite /qr/[id] sin sesión
		const activos = app.findCollectionByNameOrId('pbc_1231947254');
		activos.viewRule = ''; // público para QR
		// list/create/update/delete siguen protegidos
		activos.listRule = '@request.auth.id != ""';
		activos.createRule = '@request.auth.id != ""';
		activos.updateRule = '@request.auth.id != ""';
		activos.deleteRule = '@request.auth.id != ""';
		app.save(activos);

		// evaluaciones_endpoints view público para ficha
		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.viewRule = ''; // público
		ep.listRule = ''; // permite filtrar por relation sin auth para la ficha
		// create/update/delete siguen inmutables
		ep.createRule = '@request.auth.id != ""';
		ep.updateRule = null;
		ep.deleteRule = null;
		app.save(ep);

		// evaluaciones_red view público
		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.viewRule = '';
		red.listRule = '';
		red.createRule = '@request.auth.id != ""';
		red.updateRule = null;
		red.deleteRule = null;
		app.save(red);

		return;
	},
	(app) => {
		// rollback: vuelve a requerir auth para view
		const activos = app.findCollectionByNameOrId('pbc_1231947254');
		activos.viewRule = '@request.auth.id != ""';
		activos.listRule = '@request.auth.id != ""';
		app.save(activos);

		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.viewRule = '@request.auth.id != ""';
		ep.listRule = '@request.auth.id != ""';
		app.save(ep);

		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.viewRule = '@request.auth.id != ""';
		red.listRule = '@request.auth.id != ""';
		app.save(red);

		return;
	}
);
