/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1456254829")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"service_agent\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1456254829")

  // update collection data
  unmarshal({
    "createRule": null
  }, collection)

  return app.save(collection)
})
