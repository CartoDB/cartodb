
(function() {

var Layers = cdb.vis.Layers;

/*
 *  if we are using http and the tiles of base map need to be fetched from
 *  https try to fix it
 */

var HTTPS_TO_HTTP = {
  'https://dnv9my2eseobd.cloudfront.net/': 'http://a.tiles.mapbox.com/',
  'https://maps.nlp.nokia.com/': 'http://maps.nlp.nokia.com/',
  'https://tile.stamen.com/': 'http://tile.stamen.com/'
};

function transformToHTTP(tilesTemplate) {
  for(var url in HTTPS_TO_HTTP) {
    if(tilesTemplate.indexOf(url) !== -1) {
      return tilesTemplate.replace(url, HTTPS_TO_HTTP[url])
    }
  }
  return tilesTemplate;
}

Layers.register('tilejson', function(vis, data) {
  var url = data.tiles[0];
  url = vis.https ? url: transformToHTTP(url);
  return new cdb.geo.TileLayer({
    urlTemplate: url
  });
});

Layers.register('tiled', function(vis, data) {
  var url = data.urlTemplate;
  url = vis.https ? url: transformToHTTP(url);
  data.urlTemplate = url;
  return new cdb.geo.TileLayer(data);
});

Layers.register('gmapsbase', function(vis, data) {
  return new cdb.geo.GMapsBaseLayer(data);
});

Layers.register('plain', function(vis, data) {
  return new cdb.geo.PlainLayer(data);
});

Layers.register('background', function(vis, data) {
  return new cdb.geo.PlainLayer(data);
});

var cartoLayer = function(vis, data) {

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

  data.tiler_protocol = vis.https ? 'https': 'http';
  data.tiler_port = vis.https ? 443: 80;

  return new cdb.geo.CartoDBLayer(data);
};

Layers.register('cartodb', cartoLayer);
Layers.register('carto', cartoLayer);

})();
