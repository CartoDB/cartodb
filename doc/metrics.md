# cartodb.js metrics

these are the metrics collected by cartodb.js. Can be printed in the browser opening a console and
executing
```
cartodb.core.Profiler.print_stats()
```

## layergroup stats
- **cartodb-js.layergroup.[type].time**: type can be get or post, depending on how the layergroup was fetch. It contains the time taken to fetch layergroup (including network time)
- **cartodb-js.layergroup.[type].error**: number of errors when fetching layergroup
  **cartodb-js.layergroup.attributes.time**: time to fetch attributes (for example when an
  infowindow is open)
  **cartodb-js.layergroup.attributes.error**: fetching errors
  **cartodb-js.named_map.attributes.time**: same than layergroup.attributes but for named maps
  **cartodb-js.named_map.attributes.error**: fetching errors

## tiles stats
- **cartodb-js.tile.png.load.time**: time taken to load a *png* tile
- **cartodb-js.tile.png.error**: number of errors loading a png tile


## torque

- **torque.provider.windshaft.points**: number of points per tile
- **torque.provider.windshaft.process_time**: time used to process a tile. It does NOT include fetch
  time
- **torque.provider.windshaft.tile.fetch**: time to fetch a torque tile
- **torque.provider.windshaft.tile.error**: failed tiles
- **torque.provider.windshaft.layergroup.time**: time to instanciate the map for torque tiles
- **torque.provider.windshaft.layergroup.error**: 
- **torque.renderer.point.generateSprite**: time taken to generate a sprite based on css and point
  properties
- **torque.renderer.point.renderLayers**: time to render all the layers for a tile
- **torque.renderer.point.renderTile**: time to render a tile

