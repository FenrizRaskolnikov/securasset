/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// update collection data
		unmarshal(
			{
				createRule: '@request.auth.id != ""',
				deleteRule: '',
				updateRule: ''
			},
			collection
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// update collection data
		unmarshal(
			{
				createRule: null,
				deleteRule: null,
				updateRule: null
			},
			collection
		);

		return app.save(collection);
	}
);
