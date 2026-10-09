/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2053616856');

		// update collection data
		unmarshal(
			{
				name: 'evaluaciones_red'
			},
			collection
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2053616856');

		// update collection data
		unmarshal(
			{
				name: 'Evaluaciones_Red'
			},
			collection
		);

		return app.save(collection);
	}
);
