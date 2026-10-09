/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');
		collection.fields.addAt(
			9,
			new Field({
				autogeneratePattern: '',
				help: 'N° de Serie del activo (RF-01)',
				hidden: false,
				id: 'text_nserie_001',
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
		try {
			collection.fields.removeById('text_nserie_001');
		} catch (e) {}
		return app.save(collection);
	}
);
