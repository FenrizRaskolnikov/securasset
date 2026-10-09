/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2053616856")

  // remove field
  collection.fields.removeById("text30677878")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2053616856")

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text30677878",
    "max": 0,
    "min": 0,
    "name": "g",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
