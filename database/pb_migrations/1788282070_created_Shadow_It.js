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
					autogeneratePattern: '',
					help: '',
					hidden: false,
					id: 'text3567143141',
					max: 0,
					min: 0,
					name: 'Mac_Detectada',
					pattern: '',
					presentable: false,
					primaryKey: false,
					required: true,
					system: false,
					type: 'text'
				},
				{
					autogeneratePattern: '',
					help: '',
					hidden: false,
					id: 'text4113283526',
					max: 0,
					min: 0,
					name: 'IP_Detectada',
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
					id: 'date394017797',
					max: '',
					min: '',
					name: 'Fecha_de_Deteccion',
					presentable: false,
					required: false,
					system: false,
					type: 'date'
				},
				{
					help: '',
					hidden: false,
					id: 'select569500885',
					maxSelect: 0,
					name: 'Estado',
					presentable: false,
					required: false,
					system: false,
					type: 'select',
					values: ['Cuarentena', 'Abrobado', 'Ignorado']
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
			id: 'pbc_2297327307',
			indexes: [],
			listRule: null,
			name: 'Shadow_It',
			system: false,
			type: 'base',
			updateRule: null,
			viewRule: null
		});

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2297327307');

		return app.delete(collection);
	}
);
