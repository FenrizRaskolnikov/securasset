/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_uiyeka65hr` ON `activos` (\n  `hostname`,\n  `ip`,\n  `mac`,\n  `n_serie`\n)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1231947254")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_uiyeka65hr` ON `activos` (\n  `hostname`,\n  `ip`,\n  `mac`\n)"
    ]
  }, collection)

  return app.save(collection)
})
