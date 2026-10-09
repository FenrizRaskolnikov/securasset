/// <reference path="../pb_data/types.d.ts" />
// RF-01 — Migración crítica activos: normaliza snake_case y tipos
// Índices únicos + campos base para inventario
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// Índice único hostname+ip+mac evita duplicados CU-01
		unmarshal(
			{
				indexes: [
					'CREATE UNIQUE INDEX `idx_uiyeka65hr` ON `activos` (\n  `hostname`,\n  `ip`,\n  `mac`\n)'
				]
			},
			collection
		);

		// Campos obligatorios RF-01 hostname/ip/mac
		collection.fields.addAt(
			1,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text472359495',
				max: 0,
				min: 0,
				name: 'hostname',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		collection.fields.addAt(
			2,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text185186119',
				max: 0,
				min: 0,
				name: 'ip',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		collection.fields.addAt(
			3,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text2176100847',
				max: 0,
				min: 0,
				name: 'mac',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: true,
				system: false,
				type: 'text'
			})
		);

		// Tipo dispositivo y ubicación
		collection.fields.addAt(
			4,
			new Field({
				help: '',
				hidden: false,
				id: 'select3491738233',
				maxSelect: 0,
				name: 'tipo',
				presentable: false,
				required: false,
				system: false,
				type: 'select',
				values: ['PC', 'Servidor', 'NVR']
			})
		);

		// Responsable/ubicación y ciclo de vida CU-01
		collection.fields.addAt(
			5,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text1592004123',
				max: 0,
				min: 0,
				name: 'ubicacion',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		collection.fields.addAt(
			6,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text3570303696',
				max: 0,
				min: 0,
				name: 'responsable',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		collection.fields.addAt(
			7,
			new Field({
				help: '',
				hidden: false,
				id: 'select3544259868',
				maxSelect: 0,
				name: 'estado_ciclo',
				presentable: false,
				required: false,
				system: false,
				type: 'select',
				values: ['Operativo', 'Mantenimiento', 'Baja', 'Cuarentena']
			})
		);

		// Score RF-04 0-100 para semáforo
		collection.fields.addAt(
			8,
			new Field({
				help: '',
				hidden: false,
				id: 'number1242856169',
				max: 100,
				min: 0,
				name: 'score_seguridad',
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

		// update collection data
		unmarshal(
			{
				indexes: ['CREATE UNIQUE INDEX `idx_uiyeka65hr` ON `activos` (\n  `Hostname`,\n  `MAC`\n)']
			},
			collection
		);

		// update field
		collection.fields.addAt(
			1,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text472359495',
				max: 0,
				min: 0,
				name: 'Hostname',
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

		// update field
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

		// update field
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

		// update field
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

		// update field
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

		// update field
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

		// update field
		collection.fields.addAt(
			8,
			new Field({
				help: '',
				hidden: false,
				id: 'number1242856169',
				max: 100,
				min: 0,
				name: 'Score_Seguridad',
				onlyInt: false,
				presentable: false,
				required: false,
				system: false,
				type: 'number'
			})
		);

		return app.save(collection);
	}
);
