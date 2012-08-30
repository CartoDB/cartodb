
Layers.register('tilejson', function(vis, data) {
  return new cdb.geo.TileLayer({urlTemplate: data.tiles[0]});
});

Layers.register('cartodb', function(vis, data) {
  return new cdb.geo.CartoDBLayer(data);
});
