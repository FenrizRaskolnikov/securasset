/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// remove field
		collection.fields.removeById('text3544259868');

		// add field
		collection.fields.addAt(
			7,
			new Field({
				help: '',
				hidden: false,
				id: 'select3544259868',
				maxSelect: 0,
				name: 'Estado_Ciclo',
				presentable: false,
				required: false,
				system: false,
				type: 'select',
				values: ['Operativo', 'Mantenimiento', 'Baja', 'Cuarentena']
			})
		);

		// add field
		collection.fields.addAt(
			8,
			new Field({
				help: '',
				hidden: false,
				id: 'number1242856169',
				max: null,
				min: null,
				name: 'Score_Seguridad',
				onlyInt: false,
				presentable: false,
				required: false,
				system: false,
				type: 'number'
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// add field
		collection.fields.addAt(
			7,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text3544259868',
				max: 0,
				min: 0,
				name: 'Estado_Ciclo',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		// remove field
		collection.fields.removeById('select3544259868');

		// remove field
		collection.fields.removeById('number1242856169');

		return app.save(collection);
	}
);
