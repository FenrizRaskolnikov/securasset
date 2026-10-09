/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		// update field
		collection.fields.addAt(
			4,
			new Field({
				help: '',
				hidden: false,
				id: 'select569500885',
				maxSelect: 0,
				name: 'estado',
				presentable: false,
				required: false,
				system: false,
				type: 'select',
				values: ['Cuarentena', 'Aprobado', 'Ignorado']
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		// update field
		collection.fields.addAt(
			4,
			new Field({
				help: '',
				hidden: false,
				id: 'select569500885',
				maxSelect: 0,
				name: 'estado',
				presentable: false,
				required: false,
				system: false,
				type: 'select',
				values: ['Cuarentena', 'Abrobado', 'Ignorado']
			})
		);

		return app.save(collection);
	}
);
