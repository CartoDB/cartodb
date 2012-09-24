
Layers.register('tilejson', function(vis, data) {
  return new cdb.geo.TileLayer({urlTemplate: data.tiles[0]});
});

Layers.register('tiled', function(vis, data) {
  return new cdb.geo.TileLayer(data);
});

Layers.register('gmapsbase', function(vis, data) {
  return new cdb.geo.GMapsBaseLayer(data);
});

Layers.register('plain', function(vis, data) {
  return new cdb.geo.PlainLayer(data);
});

Layers.register('cartodb', function(vis, data) {

  if(data.infowindow && data.infowindow.fields) {
    var names = [];
    var fields = data.infowindow.fields;
    for(var i = 0; i < fields.length; ++i) {
      names.push(fields[i].name);
    }
    data.interactivity?
     data.interactivity = data.interactivity + ',' + names.join(','):
     data.interactivity = names.join(',');
  }

  return new cdb.geo.CartoDBLayer(data);
});
