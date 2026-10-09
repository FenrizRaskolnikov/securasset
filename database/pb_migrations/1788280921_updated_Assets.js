/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// add field
		collection.fields.addAt(
			2,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text185186119',
				max: 0,
				min: 0,
				name: 'IP',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		// add field
		collection.fields.addAt(
			3,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text2176100847',
				max: 0,
				min: 0,
				name: 'MAC',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		// add field
		collection.fields.addAt(
			4,
			new Field({
				help: '',
				hidden: false,
				id: 'select3491738233',
				maxSelect: 0,
				name: 'Tipo',
				presentable: false,
				required: false,
				system: false,
				type: 'select',
				values: ['PC', 'Servidor', 'NVR']
			})
		);

		// add field
		collection.fields.addAt(
			5,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text1592004123',
				max: 0,
				min: 0,
				name: 'Ubicacion',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		// add field
		collection.fields.addAt(
			6,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text3570303696',
				max: 0,
				min: 0,
				name: 'Responsable',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

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

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// remove field
		collection.fields.removeById('text185186119');

		// remove field
		collection.fields.removeById('text2176100847');

		// remove field
		collection.fields.removeById('select3491738233');

		// remove field
		collection.fields.removeById('text1592004123');

		// remove field
		collection.fields.removeById('text3570303696');

		// remove field
		collection.fields.removeById('text3544259868');

		return app.save(collection);
	}
);
