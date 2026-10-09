/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

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
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// update field
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
	}
);
