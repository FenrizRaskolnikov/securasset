/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		// update field
		collection.fields.addAt(
			1,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text3567143141',
				max: 0,
				min: 0,
				name: 'mac_detectada',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		// update field
		collection.fields.addAt(
			2,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text4113283526',
				max: 0,
				min: 0,
				name: 'ip_detectada',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		// update field
		collection.fields.addAt(
			3,
			new Field({
				help: '',
				hidden: false,
				id: 'date394017797',
				max: '',
				min: '',
				name: 'fecha_de_deteccion',
				presentable: false,
				required: false,
				system: false,
				type: 'date'
			})
		);

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
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		// update field
		collection.fields.addAt(
			1,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text3567143141',
				max: 0,
				min: 0,
				name: 'Mac_Detectada',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		// update field
		collection.fields.addAt(
			2,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text4113283526',
				max: 0,
				min: 0,
				name: 'IP_Detectada',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		// update field
		collection.fields.addAt(
			3,
			new Field({
				help: '',
				hidden: false,
				id: 'date394017797',
				max: '',
				min: '',
				name: 'Fecha_de_Deteccion',
				presentable: false,
				required: false,
				system: false,
				type: 'date'
			})
		);

		// update field
		collection.fields.addAt(
			4,
			new Field({
				help: '',
				hidden: false,
				id: 'select569500885',
				maxSelect: 0,
				name: 'Estado',
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
