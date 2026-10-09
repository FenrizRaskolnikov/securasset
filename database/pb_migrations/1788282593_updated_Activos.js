/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// update collection data
		unmarshal(
			{
				createRule: 'id != null',
				deleteRule: 'id != null',
				listRule: '',
				updateRule: 'id != null',
				viewRule: ''
			},
			collection
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// update collection data
		unmarshal(
			{
				createRule: null,
				deleteRule: null,
				listRule: null,
				updateRule: null,
				viewRule: null
			},
			collection
		);

		return app.save(collection);
	}
);
