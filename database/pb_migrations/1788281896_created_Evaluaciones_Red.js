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
					id: 'json2844418481',
					maxSize: 0,
					name: 'Puertos_Abiertos',
					presentable: false,
					required: false,
					system: false,
					type: 'json'
				},
				{
					help: '',
					hidden: false,
					id: 'bool324211505',
					name: 'Password_Default',
					presentable: false,
					required: false,
					system: false,
					type: 'bool'
				},
				{
					help: '',
					hidden: false,
					id: 'bool444169855',
					name: 'Firmware_Actualizado',
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
			id: 'pbc_2053616856',
			indexes: [],
			listRule: null,
			name: 'Evaluaciones_Red',
			system: false,
			type: 'base',
			updateRule: null,
			viewRule: null
		});

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2053616856');

		return app.delete(collection);
	}
);
