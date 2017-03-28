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
    var visModel = options.vis;

    if (visModel.get('https') === true) {
      data.urlTemplate = transformToHTTPS(data.urlTemplate);
    } else if (visModel.get('https') === false) { // Checking for an explicit false value. If it's undefined the url is left as is.
      data.urlTemplate = transformToHTTP(data.urlTemplate);
    }

    return new TileLayer(data, {
      vis: options.vis
    });
  },

  wms: function (data, options) {
    return new WMSLayer(data);
  },

  gmapsbase: function (data, options) {
    return new GMapsBaseLayer(data);
  },

  plain: function (data, options) {
    return new PlainLayer(data, {
      vis: options.vis
    });
  },

  background: function (data, options) {
    return new PlainLayer(data, {
      vis: options.vis
    });
  },

  cartodb: function (data, options) {
    return new CartoDBLayer(data, {
      vis: options.vis
    });
  },

  torque: function (attrs, options) {
    var windshaftSettings = options.windshaftSettings;

    attrs = _.extend(attrs, {
      user_name: windshaftSettings.userName,
      maps_api_template: windshaftSettings.urlTemplate,
      stat_tag: windshaftSettings.statTag,
      api_key: windshaftSettings.apiKey,
      auth_token: windshaftSettings.authToken
    });

    if (windshaftSettings.templateName) {
      attrs = _.extend(attrs, {
        named_map: {
          name: windshaftSettings.templateName
        }
      });
    }

    return new TorqueLayer(attrs, {
      vis: options.vis
    });
  }
};

var LayersFactory = function (deps) {
  if (!deps.visModel) throw new Error('visModel is required');
  if (!deps.windshaftSettings) throw new Error('windshaftSettings is required');

  this._visModel = deps.visModel;
  this._windshaftSettings = deps.windshaftSettings;
};

LayersFactory.prototype.createLayer = function (type, attrs) {
  var LayerConstructor = LAYER_CONSTRUCTORS[type.toLowerCase()];
  if (!LayerConstructor) {
    log.error("error creating layer of type '" + type + "'");
    return null;
  }
  // Flatten "options"
  var layerAttributes = _.extend({}, _.omit(attrs, 'options'), attrs.options);

  return LayerConstructor(layerAttributes, {
    windshaftSettings: this._windshaftSettings,
    vis: this._visModel
  });
};

module.exports = LayersFactory;
