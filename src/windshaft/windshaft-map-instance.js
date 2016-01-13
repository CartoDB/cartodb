var _ = require('underscore');
var Model = require('../core/model');
var WindshaftConfig = require('./config');
var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * This class represents an instance of a map in Windshaft. It's basically a wrapper
 * of the response that Windshaft returns when a new instance of a map is created
 * and provides some methods to access it's information (eg: the id of the "layergroup").
 */
var WindshaftMapInstance = Model.extend({
  TILE_EXTENSIONS_BY_LAYER_TYPE: {
    'mapnik': '.png',
    'torque': '.json.torque'
  },

  initialize: function () {
    // TODO: What params are really used?
    this.pngParams = ['map_key', 'api_key', 'cache_policy', 'updated_at'];
    this.gridParams = ['map_key', 'api_key', 'cache_policy', 'updated_at'];
  },

  isLoaded: function () {
    return !!this.get('layergroupid');
  },

  getBaseURL: function (subhost) {
    return [
      this._getHost(subhost),
      WindshaftConfig.MAPS_API_BASE_URL,
      this._getMapId()
    ].join('/');
  },

  _getMapId: function () {
    return this.get('layergroupid');
  },

  _getHost: function (subhost) {
    var userName = this.get('userName');
    var protocol = this._useHTTPS() ? 'https' : 'http';
    subhost = subhost ? subhost + '.' : '';
    var host = this.get('urlTemplate').replace('{user}', userName);
    var cdnHost = this.get('cdn_url') && this.get('cdn_url')[protocol];
    if (cdnHost) {
      host = [protocol, '://', subhost, cdnHost, '/', userName].join('');
    }

    return host;
  },

  _useHTTPS: function () {
    return this.get('urlTemplate').indexOf('https') === 0;
  },

  getTiles: function (layerType, params) {
    var grids = [];
    var tiles = [];

    var pngParams = this._encodeParams(params, this.pngParams);
    var gridParams = this._encodeParams(params, this.gridParams);
    var subdomains = ['0', '1', '2', '3'];

    if (this._useHTTPS()) {
      subdomains = [''];
    }

    layerType = layerType || 'mapnik';

    var layerIndexes = this._getLayerIndexesByType(layerType);
    if (layerIndexes.length) {
      var gridTemplate = '/{z}/{x}/{y}';

      for (var i = 0; i < subdomains.length; ++i) {
        var subdomain = subdomains[i];
        var tileURLTemplate = [
          this.getBaseURL(subdomain),
          '/',
          layerIndexes.join(','),
          '/{z}/{x}/{y}',
          this.TILE_EXTENSIONS_BY_LAYER_TYPE[layerType],
          (pngParams ? '?' + pngParams : '')
        ].join('');

        tiles.push(tileURLTemplate);

        // for mapnik layers add grid json too
        if (layerType === 'mapnik') {
          for (var layer = 0; layer < this.get('metadata').layers.length; ++layer) {
            var index = this._getLayerIndexByType(layer, 'mapnik');
            if (index >= 0) {
              var gridURLTemplate = [
                this.getBaseURL(subdomain),
                '/',
                index,
                gridTemplate,
                '.grid.json',
                (gridParams ? '?' + gridParams : '')
              ].join('');
              grids[layer] = grids[layer] || [];
              grids[layer].push(gridURLTemplate);
            }
          }
        }
      }
    } else {
      // TODO: Clients of this method should decide what to render if no layers are present
      tiles = [EMPTY_GIF];
    }

    this.urls = {
      tiles: tiles,
      grids: grids
    };
    return this.urls;
  },

  getLayerMeta: function (layerIndex) {
    var layerMeta = {};
    var layers = this.get('metadata') && this.get('metadata').layers;
    if (layers && layers[layerIndex]) {
      layerMeta = layers[layerIndex].meta || {};
    }
    return layerMeta;
  },

  _encodeParams: function (params, included) {
    if (!params) return '';
    var url_params = [];
    included = included || _.keys(params);
    for (var i in included) {
      var k = included[i];
      var p = params[k];
      if (p) {
        if (_.isArray(p)) {
          for (var j = 0, len = p.length; j < len; j++) {
            url_params.push(k + '[]=' + encodeURIComponent(p[j]));
          }
        } else {
          var q = encodeURIComponent(p);
          q = q.replace(/%7Bx%7D/g, '{x}').replace(/%7By%7D/g, '{y}').replace(/%7Bz%7D/g, '{z}');
          url_params.push(k + '=' + q);
        }
      }
    }
    return url_params.join('&');
  },

  /**
   * Returns the index of a layer of a given type, as the tiler kwows it.
   *
   * @param {string|array} types - Type or types of layers
   */
  _getLayerIndexesByType: function (types) {
    var layers = this.get('metadata') && this.get('metadata').layers;

    if (!layers) {
      return;
    }
    var layerIndexes = [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var isValidType = false;
      if (types && types.length > 0) {
        isValidType = types.indexOf(layer.type) !== -1;
      }
      if (isValidType) {
        layerIndexes.push(i);
      }
    }
    return layerIndexes;
  },

  /**
   * Returns the index of a layer of a given type, as the tiler kwows it.
   *
   * @param {integer} index - number of layer of the specified type
   * @param {string} layerType - type of the layers
   */
  _getLayerIndexByType: function (index, layerType) {
    var layers = this.get('metadata') && this.get('metadata').layers;

    if (!layers) {
      return index;
    }

    var tilerLayerIndex = {};
    var j = 0;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === layerType) {
        tilerLayerIndex[j] = i;
        j++;
      }
    }
    if (tilerLayerIndex[index] === undefined) {
      return -1;
    }
    return tilerLayerIndex[index];
  },

  getDataviewURL: function (options) {
    var dataviewId = options.dataviewId;
    var protocol = options.protocol;
    var url;
    var layers = this.get('metadata') && this.get('metadata').layers;

    _.each(layers, function (layer) {
      // TODO layer.widgets is the raw data returned from metadata… should be renamed once the result from Windshaft is changed
      var dataviews = layer.widgets;
      for (var id in dataviews) {
        if (dataviewId === id) {
          url = dataviews[id].url[protocol];
          return;
        }
      }
    });

    return url;
  }
});

module.exports = WindshaftMapInstance;
