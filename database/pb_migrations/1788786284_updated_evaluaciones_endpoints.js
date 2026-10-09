/// <reference path="../pb_data/types.d.ts" />
// RF-02 — Migración crítica evaluaciones_endpoints: 4 métricas + relación
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// BitLocker RF-02
		collection.fields.addAt(
			2,
			new Field({
				help: '',
				hidden: false,
				id: 'bool2632782765',
				name: 'bitlocker_activo',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		// EDR activo + versión
		collection.fields.addAt(
			3,
			new Field({
				help: '',
				hidden: false,
				id: 'bool3168520704',
				name: 'edr_activo',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		collection.fields.addAt(
			4,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text2869600083',
				max: 0,
				min: 0,
				name: 'edr_Version',
				pattern: '',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		// Parches y admins excesivos RF-02
		collection.fields.addAt(
			5,
			new Field({
				help: '',
				hidden: false,
				id: 'bool445375014',
				name: 'parches_so_al_dia',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		collection.fields.addAt(
			6,
			new Field({
				help: '',
				hidden: false,
				id: 'bool3474217148',
				name: 'admin_locales_excesivos',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// update field
		collection.fields.addAt(
			2,
			new Field({
				help: '',
				hidden: false,
				id: 'bool2632782765',
				name: 'Bitlocker_Activo',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		// update field
		collection.fields.addAt(
			3,
			new Field({
				help: '',
				hidden: false,
				id: 'bool3168520704',
				name: 'Edr_Activo',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		// update field
		collection.fields.addAt(
			4,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text2869600083',
				max: 0,
				min: 0,
				name: 'Edr_Version',
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
			5,
			new Field({
				help: '',
				hidden: false,
				id: 'bool445375014',
				name: 'Parches_SO_al_Dia',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		// update field
		collection.fields.addAt(
			6,
			new Field({
				help: '',
				hidden: false,
				id: 'bool3474217148',
				name: 'Admin_Locales_Excesivos',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		return app.save(collection);
	}
);
