/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2297327307")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_uu3b86g1jx` ON `shadow_it` (`mac_detectada`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2297327307")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
