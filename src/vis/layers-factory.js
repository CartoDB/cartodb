var _ = require('underscore');
var log = require('cdb.log');
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

var LAYER_CONSTRUCTORS = {
  tiled: function (data, options) {
    var url = data.urlTemplate;
    if (options.https === true) {
      url = transformToHTTPS(url);
    } else if (options.https === false) { // Checking for an explicit false value. If it's undefined the url is left as is.
      url = transformToHTTP(url);
    }

    data.urlTemplate = url;
    return new TileLayer(data);
  },

  wms: function (data, options) {
    return new WMSLayer(data);
  },

  gmapsbase: function (data, options) {
    return new GMapsBaseLayer(data);
  },

  plain: function (data, options) {
    return new PlainLayer(data);
  },

  background: function (data, options) {
    return new PlainLayer(data);
  },

  cartodb: function (data, options) {
    return new CartoDBLayer(data, {
      vis: options.vis
    });
  },

  torque: function (data, options) {
    // default is https
    if (options.https) {
      if (data.sql_api_domain && data.sql_api_domain.indexOf('carto.com') !== -1) {
        data.sql_api_protocol = 'https';
        data.sql_api_port = 443;
        data.tiler_protocol = 'https';
        data.tiler_port = 443;
      }
    }
    return new TorqueLayer(data, {
      vis: options.vis
    });
  }
};

var LayersFactory = {
  create: function (type, data, options) {
    var LayerClass = LAYER_CONSTRUCTORS[type.toLowerCase()];
    if (!LayerClass) {
      log.error("error creating layer of type '" + type + "'");
      return null;
    }
    // Flatten "options"
    var layerAttributes = _.extend({}, _.omit(data, 'options'), data.options);
    return new LayerClass(layerAttributes, options);
  }
};

module.exports = LayersFactory;
