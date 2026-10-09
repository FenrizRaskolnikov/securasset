/// <reference path="../pb_data/types.d.ts" />
// RF-03 — Migración crítica evaluaciones_red: puertos + password + firmware
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2053616856');

		// Puertos abiertos JSON RF-03
		collection.fields.addAt(
			2,
			new Field({
				help: '',
				hidden: false,
				id: 'json2844418481',
				maxSize: 0,
				name: 'puertos_abiertos',
				presentable: false,
				required: false,
				system: false,
				type: 'json'
			})
		);

		// update field
		collection.fields.addAt(
			3,
			new Field({
				help: '',
				hidden: false,
				id: 'bool324211505',
				name: 'password_default',
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
				help: '',
				hidden: false,
				id: 'bool444169855',
				name: 'firmware_actualizado',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2053616856');

		// update field
		collection.fields.addAt(
			2,
			new Field({
				help: '',
				hidden: false,
				id: 'json2844418481',
				maxSize: 0,
				name: 'Puertos_Abiertos',
				presentable: false,
				required: false,
				system: false,
				type: 'json'
			})
		);

		// update field
		collection.fields.addAt(
			3,
			new Field({
				help: '',
				hidden: false,
				id: 'bool324211505',
				name: 'Password_Default',
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
				help: '',
				hidden: false,
				id: 'bool444169855',
				name: 'Firmware_Actualizado',
				presentable: false,
				required: false,
				system: false,
				type: 'bool'
			})
		);

		return app.save(collection);
	}
);
