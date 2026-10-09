/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const shadow = app.findCollectionByNameOrId('pbc_2297327307');
		// Corregir typo Abrobado -> Aprobado y abrir update/delete para flujo CU-06 Opcion A
		shadow.listRule = '@request.auth.id != ""';
		shadow.viewRule = '@request.auth.id != ""';
		shadow.createRule = '@request.auth.id != ""';
		shadow.updateRule = '@request.auth.id != ""';
		shadow.deleteRule = '@request.auth.id != ""';

		const estadoField = shadow.fields.getByName('estado');
		if (estadoField) {
			estadoField.values = ['Cuarentena', 'Aprobado', 'Ignorado'];
		}

		app.save(shadow);

		// Asegurar activos viewRule para detalle modal con admin@admin.com
		const activos = app.findCollectionByNameOrId('pbc_1231947254');
		activos.listRule = '@request.auth.id != ""';
		activos.viewRule = '@request.auth.id != ""';
		app.save(activos);

		// Asegurar evaluaciones siguen abiertas (idempotente)
		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.listRule = '@request.auth.id != ""';
		ep.viewRule = '@request.auth.id != ""';
		app.save(ep);

		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.listRule = '@request.auth.id != ""';
		red.viewRule = '@request.auth.id != ""';
		app.save(red);

		return;
	},
	(app) => {
		const shadow = app.findCollectionByNameOrId('pbc_2297327307');
		shadow.updateRule = null;
		shadow.deleteRule = null;
		const f = shadow.fields.getByName('estado');
		if (f) f.values = ['Cuarentena', 'Abrobado', 'Ignorado'];
		app.save(shadow);
		return;
	}
);
