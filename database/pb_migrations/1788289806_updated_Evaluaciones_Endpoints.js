/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		// update collection data
		unmarshal(
			{
				name: 'evaluaciones_endpoints'
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
				name: 'Evaluaciones_Endpoints'
			},
			collection
		);

		return app.save(collection);
	}
);
