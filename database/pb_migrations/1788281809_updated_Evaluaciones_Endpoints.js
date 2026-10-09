/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// add field
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
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// remove field
		collection.fields.removeById('bool3474217148');

		return app.save(collection);
	}
);
