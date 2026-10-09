/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1231947254');

		// update collection data
		unmarshal(
			{
				indexes: ['CREATE UNIQUE INDEX `idx_uiyeka65hr` ON `Activos` (\n  `Hostname`,\n  `MAC`\n)'],
				name: 'Activos'
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
				indexes: ['CREATE UNIQUE INDEX `idx_uiyeka65hr` ON `Assets` (\n  `Hostname`,\n  `MAC`\n)'],
				name: 'Assets'
			},
			collection
		);

		return app.save(collection);
	}
);
