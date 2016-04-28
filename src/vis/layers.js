var Backbone = require('backbone');
var Layers = require('./vis/layers');
var TileLayer = require('../geo/map/tile-layer');
var WMSLayer = require('../geo/map/wms-layer');
var GMapsBaseLayer = require('../geo/map/gmaps-base-layer');
var PlainLayer = require('../geo/map/plain-layer');
var CartoDBLayer = require('../geo/map/cartodb-layer');
var TorqueLayer = require('../geo/map/torque-layer');

/*
 *  if we are using http and the tiles of base map need to be fetched from
 *  https try to fix it
 */
var HTTPS_TO_HTTP = {
  'https://dnv9my2eseobd.cloudfront.net/': 'http://a.tiles.mapbox.com/',
  'https://maps.nlp.nokia.com/': 'http://maps.nlp.nokia.com/',
  'https://tile.stamen.com/': 'http://tile.stamen.com/',
  'https://{s}.maps.nlp.nokia.com/': 'http://{s}.maps.nlp.nokia.com/',
  'https://cartocdn_{s}.global.ssl.fastly.net/': 'http://{s}.api.cartocdn.com/',
  'https://cartodb-basemaps-{s}.global.ssl.fastly.net/': 'http://{s}.basemaps.cartocdn.com/'
};

function transformToHTTP (tilesTemplate) {
  for (var url in HTTPS_TO_HTTP) {
    if (tilesTemplate.indexOf(url) !== -1) {
      return tilesTemplate.replace(url, HTTPS_TO_HTTP[url]);
    }
  }
  return tilesTemplate;
}

function transformToHTTPS (tilesTemplate) {
  for (var url in HTTPS_TO_HTTP) {
    var httpsUrl = HTTPS_TO_HTTP[url];
    if (tilesTemplate.indexOf(httpsUrl) !== -1) {
      return tilesTemplate.replace(httpsUrl, url);
    }
  }
  return tilesTemplate;
}

Layers.register('tilejson', function (data, options) {
  var url = data.tiles[0];
  if (options.https === true) {
    url = transformToHTTPS(url);
  } else if (options.https === false) { // Checking for an explicit false value. If it's undefined the url is left as is.
    url = transformToHTTP(url);
  }
  return new TileLayer({
    urlTemplate: url
  }, {
    map: options.map
  });
});

Layers.register('tiled', function (data, options) {
  var url = data.urlTemplate;
  if (options.https === true) {
    url = transformToHTTPS(url);
  } else if (options.https === false) { // Checking for an explicit false value. If it's undefined the url is left as is.
    url = transformToHTTP(url);
  }

  data.urlTemplate = url;
  return new TileLayer(data);
});

Layers.register('wms', function (data, options) {
  return new WMSLayer(data);
});

Layers.register('gmapsbase', function (data, options) {
  return new GMapsBaseLayer(data);
});

Layers.register('plain', function (data, options) {
  return new PlainLayer(data);
});

Layers.register('background', function (data, options) {
  return new PlainLayer(data);
});

Layers.register('cartodb', function (data, options) {
  normalizeOptions(data, options);
  return new CartoDBLayer(data, {
    map: options.map
  });
});

Layers.register('torque', function (data, options) {
  normalizeOptions(data, options);
  // default is https
  if (options.https) {
    if (data.sql_api_domain && data.sql_api_domain.indexOf('cartodb.com') !== -1) {
      data.sql_api_protocol = 'https';
      data.sql_api_port = 443;
      data.tiler_protocol = 'https';
      data.tiler_port = 443;
    }
  }
  return new TorqueLayer(data, {
    map: options.map
  });
});

function normalizeOptions (data, options) {
  if (data.infowindow && data.infowindow.fields) {
    if (data.interactivity) {
      if (data.interactivity.indexOf('cartodb_id') === -1) {
        data.interactivity = data.interactivity + ',cartodb_id';
      }
    } else {
      data.interactivity = 'cartodb_id';
    }
  }
}

module.exports = Layers;
