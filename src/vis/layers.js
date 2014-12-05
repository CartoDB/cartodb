
(function() {

var Layers = cdb.vis.Layers;

/*
 *  if we are using http and the tiles of base map need to be fetched from
 *  https try to fix it
 */

var HTTPS_TO_HTTP = {
  'https://dnv9my2eseobd.cloudfront.net/': 'http://a.tiles.mapbox.com/',
  'https://maps.nlp.nokia.com/': 'http://maps.nlp.nokia.com/',
  'https://tile.stamen.com/': 'http://tile.stamen.com/',
  "https://{s}.maps.nlp.nokia.com/": "http://{s}.maps.nlp.nokia.com/",
  "https://cartocdn_{s}.global.ssl.fastly.net/": "http://{s}.api.cartocdn.com/"
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

Layers.register('wms', function(vis, data) {
  return new cdb.geo.WMSLayer(data);
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


function normalizeOptions(vis, data) {
  if(data.infowindow && data.infowindow.fields) {
    if(data.interactivity) {
      if(data.interactivity.indexOf('cartodb_id') === -1) {
        data.interactivity = data.interactivity + ",cartodb_id";
      }
    } else {
      data.interactivity = 'cartodb_id';
    }
  }
  // if https is forced
  if(vis.https) {
    data.tiler_protocol = 'https';
    data.tiler_port = 443;
    data.sql_api_protocol = 'https';
    data.sql_api_port = 443;
  }
  data.cartodb_logo = vis.cartodb_logo == undefined ? data.cartodb_logo : vis.cartodb_logo;
}

var cartoLayer = function(vis, data) {
  normalizeOptions(vis, data);
  // if sublayers are included that means a layergroup should
  // be created
  if(data.sublayers) {
    data.type = 'layergroup';
    return new cdb.geo.CartoDBGroupLayer(data);
  }
  return new cdb.geo.CartoDBLayer(data);
};

Layers.register('cartodb', cartoLayer);
Layers.register('carto', cartoLayer);

Layers.register('layergroup', function(vis, data) {
  normalizeOptions(vis, data);
  return new cdb.geo.CartoDBGroupLayer(data);
});

Layers.register('namedmap', function(vis, data) {
  normalizeOptions(vis, data);
  return new cdb.geo.CartoDBNamedMapLayer(data);
});

Layers.register('torque', function(vis, data) {
  // default is https
  if(vis.https) {
    if(data.sql_api_domain && data.sql_api_domain.indexOf('cartodb.com') !== -1) {
      data.sql_api_protocol = 'https';
      data.sql_api_port = 443;
      data.tiler_protocol = 'https';
      data.tiler_port = 443;
    }
  }
  data.cartodb_logo = vis.cartodb_logo == undefined ? data.cartodb_logo : vis.cartodb_logo;
  return new cdb.geo.TorqueLayer(data);
});

})();
