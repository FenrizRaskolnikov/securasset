/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		// Allow authenticated users (admin@admin.com) to list/view evaluaciones and shadow_it
		// Previously listRule/viewRule = null (only superusers) -> modal Postura vacia para users
		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.listRule = '@request.auth.id != ""';
		ep.viewRule = '@request.auth.id != ""';
		app.save(ep);

		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.listRule = '@request.auth.id != ""';
		red.viewRule = '@request.auth.id != ""';
		app.save(red);

		const shadow = app.findCollectionByNameOrId('pbc_2297327307');
		shadow.listRule = '@request.auth.id != ""';
		shadow.viewRule = '@request.auth.id != ""';
		app.save(shadow);

		// Activos viewRule was null (only superuser view), ensure authenticated can view detail
		const activos = app.findCollectionByNameOrId('pbc_1231947254');
		activos.listRule = '@request.auth.id != ""';
		activos.viewRule = '@request.auth.id != ""';
		app.save(activos);

		return;
	},
	(app) => {
		const ep = app.findCollectionByNameOrId('pbc_1456254829');
		ep.listRule = null;
		ep.viewRule = null;
		app.save(ep);

		const red = app.findCollectionByNameOrId('pbc_2053616856');
		red.listRule = null;
		red.viewRule = null;
		app.save(red);

		const shadow = app.findCollectionByNameOrId('pbc_2297327307');
		shadow.listRule = null;
		shadow.viewRule = null;
		app.save(shadow);

		const activos = app.findCollectionByNameOrId('pbc_1231947254');
		activos.listRule = '@request.auth.id != ""';
		activos.viewRule = null;
		app.save(activos);

		return;
	}
);
