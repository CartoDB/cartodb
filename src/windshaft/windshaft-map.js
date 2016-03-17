var Backbone = require('backbone');
var _ = require('underscore');
var WindshaftFiltersCollection = require('./filters/collection');
var WindshaftLayerGroupConfig = require('./layergroup-config');
var WindshaftNamedMapConfig = require('./namedmap-config');
var WindshaftConfig = require('./config');
var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
    this.client = options.client;
    this.statTag = options.statTag;
    this.configGenerator = options.configGenerator;
    this.apiKey = options.apiKey;
    this.set({
      urlTemplate: this.client.urlTemplate,
      userName: this.client.userName
    });

    if (!options.client) {
      throw new Error('client option is required');
    }
    if (!options.dataviewsCollection) {
      throw new Error('dataviewsCollection option is required');
    }
    if (!options.layersCollection) {
      throw new Error('layersCollection option is required');
    }

    this._dataviewsCollection = options.dataviewsCollection;
    this._layersCollection = options.layersCollection;
  },

  isNamedMap: function () {
    return this.configGenerator === WindshaftNamedMapConfig;
  },

  isAnonymousMap: function () {
    return this.configGenerator === WindshaftLayerGroupConfig;
  },

  createInstance: function (options) {
    options = options || {};

    var sourceLayerId = options.sourceLayerId;
    var forceFetch = options.forceFetch;

    var filters = this._getFiltersFromVisibleLayers();
    this.client.instantiateMap({
      mapDefinition: this.toMapConfig(),
      apiKey: this.apiKey,
      statTag: this.statTag,
      filters: filters.toJSON(),
      success: function (mapInstance) {
        this.set(mapInstance);

        // TODO: This responsibility should be extracted from this class
        this._updateLayersFromWindshaftInstance();

        this.trigger('instanceCreated', this, sourceLayerId, forceFetch);
      }.bind(this),
      error: function (error) {
        console.log('Error creating the map instance on Windshaft: ' + error);
      }
    });

    return this;
  },

  toMapConfig: function () {
    return this.configGenerator.generate({
      layers: this._getLayers(),
      dataviews: this._dataviewsCollection
    });
  },

  _getLayers: function () {
    return this._layersCollection.select(function (layer) {
      return LAYER_TYPES.indexOf(layer.get('type')) >= 0;
    });
  },

  _getFiltersFromVisibleLayers: function () {
    var filtersFromVisibleLayers = this._dataviewsCollection
      .chain()
      .filter(function (dataview) {
        return dataview.layer.isVisible();
      })
      .map(function (dataview) {
        return dataview.filter;
      })
      .compact() // not all dataviews have filters
      .value();

    var layers = this._getLayers();
    return new WindshaftFiltersCollection(filtersFromVisibleLayers, layers);
  },

  _updateLayersFromWindshaftInstance: function () {
    var layers = this._getLayers();
    _.each(layers, function (layer, layerIndex) {
      if (layer.get('type') === 'torque') {
        layer.set('meta', this.getLayerMeta(layerIndex));
        layer.set('urls', this.getTiles('torque'));
      } else if (layer.get('type') === 'CartoDB') {
        layer.set('meta', this.getLayerMeta(layerIndex));
      }
    }, this);
  },

  setAPIKey: function (apiKey) {
    this.apiKey = apiKey;
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
  },

  getTiles: function (layerType) {
    var grids = [];
    var tiles = [];

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
          TILE_EXTENSIONS_BY_LAYER_TYPE[layerType],
          this.apiKey ? '?api_key=' + this.apiKey : ''
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
                this.apiKey ? '?api_key=' + this.apiKey : ''
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
    var metadataLayerIndex = this._localLayerIndexToWindshaftLayerIndex(layerIndex);
    var layers = this.get('metadata') && this.get('metadata').layers;
    if (layers && layers[metadataLayerIndex]) {
      layerMeta = layers[metadataLayerIndex].meta || {};
    }
    return layerMeta;
  },

  _localLayerIndexToWindshaftLayerIndex: function (layerIndex) {
    var layers = this.get('metadata') && this.get('metadata').layers;
    var hasTiledLayer = layers.length > 0 && layers[0].type === 'http';
    return hasTiledLayer ? ++layerIndex : layerIndex;
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
  }
});

module.exports = WindshaftMap;
