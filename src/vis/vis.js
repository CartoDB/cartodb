var _ = require('underscore');
var Backbone = require('backbone');
var util = require('cdb.core.util');
var Map = require('../geo/map');
var DataviewsFactory = require('../dataviews/dataviews-factory');
var WindshaftConfig = require('../windshaft/config');
var WindshaftClient = require('../windshaft/client');
var WindshaftNamedMap = require('../windshaft/named-map');
var WindshaftAnonymousMap = require('../windshaft/anonymous-map');
var AnalysisFactory = require('../analysis/analysis-factory');
var CartoDBLayerGroupNamedMap = require('../geo/cartodb-layer-group-named-map');
var CartoDBLayerGroupAnonymousMap = require('../geo/cartodb-layer-group-anonymous-map');
var ModelUpdater = require('./model-updater');
var LayersCollection = require('../geo/map/layers');
var AnalysisPoller = require('../analysis/analysis-poller');
var Layers = require('./vis/layers');

var VisModel = Backbone.Model.extend({
  defaults: {
    loading: false,
    https: false,
    showLegends: false,
    showEmptyInfowindowFields: false
  },

  initialize: function () {
    this._loadingObjects = [];
    this._analysisPoller = new AnalysisPoller();
    this._layersCollection = new LayersCollection();
    this._analysisCollection = new Backbone.Collection();
    this._dataviewsCollection = new Backbone.Collection();

    this.overlaysCollection = new Backbone.Collection();
  },

  done: function (callback) {
    this.on('done', callback);
    return this;
  },

  error: function (callback) {
    this.on('error', callback);
    return this;
  },

  /**
   * @return Array of {LayerModel}
   */
  getLayers: function () {
    return _.clone(this.map.layers.models);
  },

  /**
   * @param {Integer} index Layer index (including base layer if present)
   * @return {LayerModel}
   */
  getLayer: function (index) {
    return this.map.layers.at(index);
  },

  load: function (vizjson) {
    // Create the WindhaftClient
    var endpoint;
    var WindshaftMapClass;
    var CartoDBLayerGroupClass;

    var datasource = vizjson.datasource;
    var isNamedMap = !!datasource.template_name;

    if (isNamedMap) {
      endpoint = [ WindshaftConfig.MAPS_API_BASE_URL, 'named', datasource.template_name ].join('/');
      CartoDBLayerGroupClass = CartoDBLayerGroupNamedMap;
      WindshaftMapClass = WindshaftNamedMap;
    } else {
      endpoint = WindshaftConfig.MAPS_API_BASE_URL;
      CartoDBLayerGroupClass = CartoDBLayerGroupAnonymousMap;
      WindshaftMapClass = WindshaftAnonymousMap;
    }

    this.layerGroupModel = new CartoDBLayerGroupClass({
      apiKey: this.get('apiKey')
    }, {
      layersCollection: this._layersCollection
    });

    var windshaftClient = new WindshaftClient({
      endpoint: endpoint,
      urlTemplate: datasource.maps_api_template,
      userName: datasource.user_name,
      forceCors: datasource.force_cors || true
    });

    var modelUpdater = new ModelUpdater({
      layerGroupModel: this.layerGroupModel,
      dataviewsCollection: this._dataviewsCollection,
      layersCollection: this._layersCollection,
      analysisCollection: this._analysisCollection
    });

    // Create the WindshaftMap
    this._windshaftMap = new WindshaftMapClass({
      apiKey: this.get('apiKey'),
      statTag: datasource.stat_tag
    }, {
      client: windshaftClient,
      modelUpdater: modelUpdater,
      dataviewsCollection: this._dataviewsCollection,
      layersCollection: this._layersCollection,
      analysisCollection: this._analysisCollection
    });

    // Create the Map
    var allowDragging = util.isMobileDevice() || vizjson.hasZoomOverlay() || vizjson.scrollwheel;

    var mapConfig = {
      title: vizjson.title,
      description: vizjson.description,
      maxZoom: vizjson.maxZoom,
      minZoom: vizjson.minZoom,
      bounds: vizjson.bounds,
      center: vizjson.center,
      zoom: vizjson.zoom,
      scrollwheel: !!this.scrollwheel,
      drag: allowDragging,
      provider: vizjson.map_provider,
      vector: vizjson.vector
    };

    this.map = new Map(mapConfig, {
      layersCollection: this._layersCollection,
      windshaftMap: this._windshaftMap,
      dataviewsCollection: this._dataviewsCollection
    });

    // Reset the collection of overlays
    this.overlaysCollection.reset(vizjson.overlays);

    // Create the public Dataview Factory
    this.dataviews = new DataviewsFactory({
      apiKey: this.get('apiKey')
    }, {
      dataviewsCollection: this._dataviewsCollection,
      map: this.map
    });

    // Create the public Analysis Factory
    this.analysis = new AnalysisFactory({
      apiKey: this.get('apiKey'),
      analysisCollection: this._analysisCollection,
      map: this.map
    });

    this._windshaftMap.bind('instanceCreated', this._onMapInstanceCreated, this);

    // Lastly: reset the layer models on the map
    var layerModels = this._newLayerModels(vizjson, this.map);
    this.map.layers.reset(layerModels);

    // "Load" existing analyses from the viz.json. This will generate
    // the analyses graphs and index analysis nodes in the
    // collection of analysis
    if (vizjson.analyses) {
      _.each(vizjson.analyses, function (analysis) {
        this.analysis.analyse(analysis);
      }, this);
    }
    // Global variable for easier console debugging / testing
    window.vis = this;

    _.defer(function () {
      this.trigger('load', this);
    }.bind(this));
  },

  _onMapInstanceCreated: function () {
    this._analysisPoller.reset();
    this._analysisCollection.each(function (analysisModel) {
      analysisModel.unbind('change:status', this._onAnalysisStatusChanged, this);
      if (analysisModel.url() && !analysisModel.isDone()) {
        this._analysisPoller.poll(analysisModel);
        this.trackLoadingObject(analysisModel);
        analysisModel.bind('change:status', this._onAnalysisStatusChanged, this);
      }
    }, this);
  },

  _onAnalysisStatusChanged: function (analysisModel) {
    if (analysisModel.isDone()) {
      this.untrackLoadingObject(analysisModel);
      if (this._isAnalysisSourceOfLayerOrDataview(analysisModel)) {
        this.map.reload();
      }
    }
  },

  _isAnalysisSourceOfLayerOrDataview: function (analysisModel) {
    var isAnalysisLinkedToLayer = this._layersCollection.any(function (layerModel) {
      return layerModel.get('source') === analysisModel.get('id');
    });
    var isAnalysisLinkedToDataview = this._dataviewsCollection.any(function (dataviewModel) {
      var sourceId = dataviewModel.getSourceId();
      return analysisModel.get('id') === sourceId;
    });
    return isAnalysisLinkedToLayer || isAnalysisLinkedToDataview;
  },

  trackLoadingObject: function (object) {
    if (this._loadingObjects.indexOf(object) === -1) {
      this._loadingObjects.push(object);
    }
    this.set('loading', true);
  },

  untrackLoadingObject: function (object) {
    var index = this._loadingObjects.indexOf(object);
    if (index >= 0) {
      this._loadingObjects.splice(index, 1);
      if (this._loadingObjects.length === 0) {
        this.set('loading', false);
      }
    }
  },

  /**
   * Force a map instantiation.
   * Only expected to be called if {skipMapInstantiation} flag is set to true when vis is created.
   */
  instantiateMap: function (options) {
    options = options || {};
    var self = this;

    // TODO: invalidateSize
    this._dataviewsCollection.on('add reset remove', _.debounce(this.invalidateSize, 10), this);
    this.map.instantiateMap(_.pick(options, ['success', 'error']));

    // Trigger 'done' event
    _.defer(function () {
      self.trigger('done', self, self.map.layers);
    });
  },

  invalidateSize: function () {
    this.trigger('invalidateSize');
  },

  centerMapToOrigin: function () {
    this.invalidateSize();
    this.map.reCenter();
  },

  _newLayerModels: function (vizjson, map) {
    var layerModels = [];
    var layersOptions = {
      https: this.get('https'),
      map: map
    };
    _.each(vizjson.layers, function (layerData) {
      if (layerData.type === 'layergroup' || layerData.type === 'namedmap') {
        var layersData;
        if (layerData.type === 'layergroup') {
          layersData = layerData.options.layer_definition.layers;
        } else {
          layersData = layerData.options.named_map.layers;
        }
        _.each(layersData, function (layerData) {
          layerModels.push(Layers.create('CartoDB', layerData, layersOptions));
        });
      } else {
        layerModels.push(Layers.create(layerData.type, layerData, layersOptions));
      }
    });

    return layerModels;
  }
});

module.exports = VisModel;
