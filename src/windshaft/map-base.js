var Backbone = require('backbone');
var _ = require('underscore');
var WindshaftConfig = require('./config');
var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
var log = require('cdb.log');

var TILE_EXTENSIONS_BY_LAYER_TYPE = {
  'mapnik': '.png',
  'torque': '.json.torque'
};

var LAYER_TYPES = [
  'CartoDB',
  'torque'
];

var WindshaftMap = Backbone.Model.extend({
  initialize: function (attrs, options) {
    if (!options.client) {
      throw new Error('client option is required');
    }
    // TODO: We could use the layerGroupModel instead! Only contains layers of type 'CartoDB' and 'Torque'
    if (!options.layersCollection) {
      throw new Error('layersCollection option is required');
    }
    if (!options.dataviewsCollection) {
      throw new Error('dataviewsCollection option is required');
    }
    if (!options.analysisCollection) {
      throw new Error('analysisCollection option is required');
    }
    if (!options.modelUpdater) {
      throw new Error('modelUpdater option is required');
    }

    this.client = options.client;
    this.set({
      urlTemplate: this.client.urlTemplate,
      userName: this.client.userName
    });

    this._layersCollection = options.layersCollection;
    this._dataviewsCollection = options.dataviewsCollection;
    this._analysisCollection = options.analysisCollection;
    this._modelUpdater = options.modelUpdater;
  },

  toJSON: function () {
    throw new Error('Subclasses of windshaft/map-base must implement .toJSON');
  },

  createInstance: function (options) {
    options = options || {};

    var sourceLayerId = options.sourceLayerId;
    var forceFetch = options.forceFetch;

    var params = {
      stat_tag: this.get('statTag')
    };

    if (this.get('apiKey')) {
      params.api_key = this.get('apiKey');
    }

    var filters = this._getFilterParamFromDataviews();
    if (!_.isEmpty(filters)) {
      params.filters = filters;
    }

    this.client.instantiateMap({
      mapDefinition: this.toJSON(),
      params: params,
      success: function (mapInstance) {
        this.set(mapInstance);
        this._modelUpdater.updateModels(this, sourceLayerId, forceFetch);
        this.trigger('instanceCreated');
        options.success && options.success(this);
      }.bind(this),
      error: function (error) {
        var errorMsg = 'Request to Maps API failed: ' + error;
        log.error(errorMsg);
        options.error && options.error(errorMsg);
      }
    });

    return this;
  },

  _getFilterParamFromDataviews: function () {
    return this._dataviewsCollection.reduce(function (filters, dataview) {
      var filter = dataview.filter;
      if (filter && !filter.isEmpty()) {
        filters['dataviews'] = filters['dataviews'] || {};
        _.extend(filters['dataviews'], filter.toJSON());
      }
      return filters;
    }, {});
  },

  _getLayers: function () {
    return this._layersCollection.select(function (layer) {
      return LAYER_TYPES.indexOf(layer.get('type')) >= 0;
    });
  },

  getBaseURL: function (subhost) {
    return [
      this._getHost(subhost),
      WindshaftConfig.MAPS_API_BASE_URL,
      this.get('layergroupid')
    ].join('/');
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

  getDataviewMetadata: function (dataviewId) {
    // Try to get dataview's metadata from this.get('metadata').dataview
    var dataviews = this.get('metadata') && this.get('metadata').dataviews;
    if (dataviews && dataviews[dataviewId]) {
      return dataviews[dataviewId];
    }

    // Try to get dataview's metatadta from the 'widgets' dictionary inside the metadata of each of the layers
    dataviews = {};
    var layersDataviews = _.compact(_.map(this.get('metadata').layers, function (layer) { return layer.widgets; }));
    _.each(layersDataviews, function (layerDataviews) {
      _.extend(dataviews, layerDataviews);
    });

    if (dataviews && dataviews[dataviewId]) {
      return dataviews[dataviewId];
    }
  },

  getAnalysisNodeMetadata: function (analysisId) {
    var metadata = {};
    var nodes = _.map(this.get('metadata').analyses, function (analysis) {
      return analysis.nodes;
    });
    _.each(nodes, function (node) {
      _.extend(metadata, node);
    });

    return metadata[analysisId];
  },

  getTiles: function (layerType) {
    layerType = layerType || 'mapnik';
    var grids = [];
    var tiles = [];
    var subdomains = ['0', '1', '2', '3'];
    if (this._useHTTPS()) {
      subdomains = [''];
    }

    var layerIndexes = this._getLayerIndexesByType(layerType);
    if (layerIndexes.length) {
      for (var i = 0; i < subdomains.length; ++i) {
        var subdomain = subdomains[i];
        tiles.push(this._getTileURLTemplate(subdomain, layerIndexes, layerType));

        // for mapnik layers add grid json too
        if (layerType === 'mapnik') {
          for (var layerIndex = 0; layerIndex < this.get('metadata').layers.length; ++layerIndex) {
            var mapnikLayerIndex = this._getLayerIndexByType(layerIndex, 'mapnik');
            if (mapnikLayerIndex >= 0) {
              grids[layerIndex] = grids[layerIndex] || [];
              grids[layerIndex].push(this._getGridURLTemplate(subdomain, mapnikLayerIndex));
            }
          }
        }
      }
    } else {
      tiles = [EMPTY_GIF];
    }

    return {
      tiles: tiles,
      grids: grids
    };
  },

  /**
   * Generates the URL template for a given tile.
   *
   * EG: http://example.com:8181/api/v1/map/LAYERGROUP_ID/1,2/{z}/{x}/{y}.png?
   */
  _getTileURLTemplate: function (subdomain, layerIndexes, layerType, params) {
    var baseURL = this.getBaseURL(subdomain);
    var tileSchema = '{z}/{x}/{y}';
    var tileExtension = TILE_EXTENSIONS_BY_LAYER_TYPE[layerType];
    var urlParams = this.get('apiKey') ? '?api_key=' + this.get('apiKey') : '';

    return baseURL + '/' + layerIndexes.join(',') + '/' + tileSchema + tileExtension + urlParams;
  },

  /**
   * Generates the URL template for the UTF-8 grid of a given tile and layer.
   *
   * EG: http://example.com:8181/api/v1/map/LAYERGROUP_ID/1/{z}/{x}/{y}.grid.json
   */
  _getGridURLTemplate: function (subdomain, layerIndex, params) {
    var baseURL = this.getBaseURL(subdomain);
    var tileSchema = '{z}/{x}/{y}';
    var urlParams = this.get('apiKey') ? '?api_key=' + this.get('apiKey') : '';

    return baseURL + '/' + layerIndex + '/' + tileSchema + '.grid.json' + urlParams;
  },

  getLayerMetadata: function (layerIndex) {
    var layerMeta = {};
    var metadataLayerIndex = this._localLayerIndexToWindshaftLayerIndex(layerIndex);
    var layers = this.get('metadata') && this.get('metadata').layers;
    if (layers && layers[metadataLayerIndex]) {
      layerMeta = layers[metadataLayerIndex].meta || {};
    }
    return layerMeta;
  },

  _localLayerIndexToWindshaftLayerIndex: function (layerIndex) {
    var layers = this.get('metadata') && this.get('metadata').layers;
    var hasTiledLayer = layers.length > 0 && (layers[0].type === 'http' || layers[0].type === 'plain');
    return hasTiledLayer ? ++layerIndex : layerIndex;
  },

  /**
   * Returns the indexes of the layer of a given type, as the tiler kwows it.
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
  }
});

module.exports = WindshaftMap;
