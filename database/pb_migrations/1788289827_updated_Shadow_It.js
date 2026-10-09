/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		// update collection data
		unmarshal(
			{
				name: 'shadow_it'
			},
			collection
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		// update collection data
		unmarshal(
			{
				name: 'Shadow_It'
			},
			collection
		);

		return app.save(collection);
	}
);
