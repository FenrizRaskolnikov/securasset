/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// add field
		collection.fields.addAt(
			9,
			new Field({
				autogeneratePattern: '',
				help: '',
				hidden: false,
				id: 'text3609540301',
				max: 0,
				min: 0,
				name: 'n_serie',
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
		collection.fields.removeById('text3609540301');

		return app.save(collection);
	}
);
