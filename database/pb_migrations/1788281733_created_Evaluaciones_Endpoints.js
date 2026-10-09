/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = new Collection({
			createRule: null,
			deleteRule: null,
			fields: [
				{
					autogeneratePattern: '[a-z0-9]{15}',
					help: '',
					hidden: false,
					id: 'text3208210256',
					max: 15,
					min: 15,
					name: 'id',
					pattern: '^[a-z0-9]+$',
					presentable: false,
					primaryKey: true,
					required: true,
					system: true,
					type: 'text'
				},
				{
					cascadeDelete: false,
					collectionId: 'pbc_1231947254',
					help: '',
					hidden: false,
					id: 'relation1653163849',
					maxSelect: 0,
					minSelect: 0,
					name: 'relation',
					presentable: false,
					required: false,
					system: false,
					type: 'relation'
				},
				{
					help: '',
					hidden: false,
					id: 'bool2632782765',
					name: 'Bitlocker_Activo',
					presentable: false,
					required: false,
					system: false,
					type: 'bool'
				},
				{
					help: '',
					hidden: false,
					id: 'bool3168520704',
					name: 'Edr_Activo',
					presentable: false,
					required: false,
					system: false,
					type: 'bool'
				},
				{
					autogeneratePattern: '',
					help: '',
					hidden: false,
					id: 'text2869600083',
					max: 0,
					min: 0,
					name: 'Edr_Version',
					pattern: '',
					presentable: false,
					primaryKey: false,
					required: false,
					system: false,
					type: 'text'
				},
				{
					help: '',
					hidden: false,
					id: 'bool445375014',
					name: 'Parches_SO_al_Dia',
					presentable: false,
					required: false,
					system: false,
					type: 'bool'
				},
				{
					hidden: false,
					id: 'autodate2990389176',
					name: 'created',
					onCreate: true,
					onUpdate: false,
					presentable: false,
					system: false,
					type: 'autodate'
				},
				{
					hidden: false,
					id: 'autodate3332085495',
					name: 'updated',
					onCreate: true,
					onUpdate: true,
					presentable: false,
					system: false,
					type: 'autodate'
				}
			],
			id: 'pbc_1456254829',
			indexes: [],
			listRule: null,
			name: 'Evaluaciones_Endpoints',
			system: false,
			type: 'base',
			updateRule: null,
			viewRule: null
		});

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1456254829');

		return app.delete(collection);
	}
);
