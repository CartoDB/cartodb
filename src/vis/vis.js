var _ = require('underscore');
var Backbone = require('backbone');
var util = require('../core/util');
var Map = require('../geo/map');
var DataviewsFactory = require('../dataviews/dataviews-factory');
var DataviewsCollection = require('../dataviews/dataviews-collection');
var WindshaftClient = require('../windshaft/client');
var WindshaftNamedMap = require('../windshaft/named-map');
var WindshaftAnonymousMap = require('../windshaft/anonymous-map');
var AnalysisFactory = require('../analysis/analysis-factory');
var CartoDBLayerGroup = require('../geo/cartodb-layer-group');
var ModelUpdater = require('../windshaft-integration/model-updater');
var LayersCollection = require('../geo/map/layers');
var AnalysisPoller = require('../analysis/analysis-poller');
var LayersFactory = require('./layers-factory');
var SettingsModel = require('./settings');
var whenAllDataviewsFetched = require('./dataviews-tracker');
var RenderModes = require('../geo/render-modes');

var STATE_INIT = 'init'; // vis hasn't been sent to Windshaft
var STATE_OK = 'ok'; // vis has been sent to Windshaft and everything is ok
var STATE_ERROR = 'error'; // vis has been sent to Windshaft and there were some issues

var VisModel = Backbone.Model.extend({
  defaults: {
    loading: false,
    showEmptyInfowindowFields: false,
    state: STATE_INIT
  },

  initialize: function () {
    this._loadingObjects = [];
    this._analysisPoller = new AnalysisPoller();
    this._layersCollection = new LayersCollection();
    this._analysisCollection = new Backbone.Collection();
    this._dataviewsCollection = new DataviewsCollection();

    this.overlaysCollection = new Backbone.Collection();
    this.settings = new SettingsModel();

    this.layerGroupModel = new CartoDBLayerGroup({
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken')
    }, {
      layersCollection: this._layersCollection
    });

    this._instantiateMapWasCalled = false;
  },

  getStaticImageURL: function (options) {
    options = _.defaults({}, options, {
      zoom: 4,
      lat: 0,
      lng: 0,
      width: 300,
      height: 300,
      format: 'png'
    });

    var url;
    var urlTemplate = this.layerGroupModel.getStaticImageURLTemplate();
    if (urlTemplate) {
      url = urlTemplate
        .replace('{z}', options.zoom)
        .replace('{lat}', options.lat)
        .replace('{lng}', options.lng)
        .replace('{width}', options.width)
        .replace('{height}', options.height)
        .replace('{format}', options.format);
    }
    return url;
  },

  done: function (callback) {
    this._doneCallback = callback;
    return this;
  },

  setOk: function () {
    // Invoke this._doneCallback if present, the first time
    // the vis is instantiated correctly
    if (this.get('state') === STATE_INIT) {
      this._doneCallback && this._doneCallback(this);
    }

    this.set('state', STATE_OK);
    this.unset('error');
  },

  error: function (callback) {
    this._errorCallback = callback;
    return this;
  },

  setError: function (error) {
    // Invoke this._errorCallback if present, the first time
    // the vis is instantiated and the're some errors
    if (this.get('state') === STATE_INIT) {
      this._errorCallback && this._errorCallback(error);
    }

    this.set({
      state: STATE_ERROR,
      error: error
    });
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

    var datasource = vizjson.datasource;

    var windshaftSettings = {
      urlTemplate: vizjson.datasource.maps_api_template,
      userName: vizjson.datasource.user_name,
      statTag: vizjson.datasource.stat_tag,
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken')
    };

    var WindshaftMapClass = WindshaftAnonymousMap;
    if (vizjson.isNamedMap()) {
      windshaftSettings.templateName = vizjson.datasource.template_name;
      WindshaftMapClass = WindshaftNamedMap;
    }

    var windshaftClient = new WindshaftClient(windshaftSettings);

    var layersFactory = new LayersFactory({
      visModel: this,
      windshaftSettings: windshaftSettings
    });

    // Create the Map
    var allowDragging = util.isMobileDevice() || vizjson.hasZoomOverlay() || vizjson.scrollwheel;

    var renderMode = RenderModes.AUTO;
    if (vizjson.vector === true) {
      renderMode = RenderModes.VECTOR;
    } else if (vizjson.vector === false) {
      renderMode = RenderModes.RASTER;
    }

    this.map = new Map({
      title: vizjson.title,
      description: vizjson.description,
      bounds: vizjson.bounds,
      center: vizjson.center,
      zoom: vizjson.zoom,
      scrollwheel: !!this.scrollwheel,
      drag: allowDragging,
      provider: vizjson.map_provider,
      isFeatureInteractivityEnabled: this.get('interactiveFeatures'),
      renderMode: renderMode
    }, {
      layersCollection: this._layersCollection,
      layersFactory: layersFactory
    });

    this.listenTo(this.map, 'cartodbLayerMoved', this.reload);

    var modelUpdater = new ModelUpdater({
      visModel: this,
      mapModel: this.map,
      layerGroupModel: this.layerGroupModel,
      dataviewsCollection: this._dataviewsCollection,
      layersCollection: this._layersCollection,
      analysisCollection: this._analysisCollection
    });

    // Create the WindshaftMap
    this._windshaftMap = new WindshaftMapClass({
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken'),
      statTag: datasource.stat_tag
    }, {
      client: windshaftClient,
      modelUpdater: modelUpdater,
      windshaftSettings: windshaftSettings,
      dataviewsCollection: this._dataviewsCollection,
      layersCollection: this._layersCollection,
      analysisCollection: this._analysisCollection
    });

    // Reset the collection of overlays
    this.overlaysCollection.reset(vizjson.overlays);

    // Create the public Dataview Factory
    this.dataviews = new DataviewsFactory({
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken')
    }, {
      map: this.map,
      vis: this,
      dataviewsCollection: this._dataviewsCollection,
      analysisCollection: this._analysisCollection
    });

    // Create the public Analysis Factory
    this.analysis = new AnalysisFactory({
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken'),
      analysisCollection: this._analysisCollection,
      vis: this
    });

    this._windshaftMap.bind('instanceCreated', this._onMapInstanceCreated, this);

    // TODO: This can be removed once https://github.com/CartoDB/cartodb/pull/9118
    // will be merged and released. Leaving this here for backwards compatibility
    // and to make sure everything still works fine during the release and next
    // few moments (e.g: some viz.json files might be cached, etc.).
    var layersData = this._flattenLayers(vizjson.layers);
    var layerModels = _.map(layersData, function (layerData, layerIndex) {
      _.extend(layerData, { order: layerIndex });
      return layersFactory.createLayer(layerData.type, layerData);
    });

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

  // we provide a method to set some new settings
  setSettings: function (settings) {
    this.settings.set(settings);
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
        this.reload();
      }
    }
  },

  _isAnalysisSourceOfLayerOrDataview: function (analysisModel) {
    var isAnalysisLinkedToLayer = this._layersCollection.any(function (layerModel) {
      return layerModel.get('source') === analysisModel.get('id');
    });
    var isAnalysisLinkedToDataview = this._dataviewsCollection.isAnalysisLinkedToDataview(analysisModel);
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
   * Only expected to be called once if {skipMapInstantiation} flag is set to true when vis is created.
   */
  instantiateMap: function (options) {
    options = options || {};
    if (this._instantiateMapWasCalled) {
      return;
    }
    this._instantiateMapWasCalled = true;

    this.reload({
      success: function () {
        options.success && options.success();
        this._onMapInstantiatedForTheFirstTime();
      }.bind(this),
      error: function () {
        options.error && options.error();
      },
      includeFilters: false
    });
  },

  _onMapInstantiatedForTheFirstTime: function () {
    var anyDataviewFiltered = this._isAnyDataviewFiltered();
    whenAllDataviewsFetched(this._dataviewsCollection, this._onDataviewFetched.bind(this));
    this._initBindsAfterFirstMapInstantiation();

    anyDataviewFiltered && this.reload({ includeFilters: anyDataviewFiltered });
  },

  _isAnyDataviewFiltered: function () {
    return this._dataviewsCollection.isAnyDataviewFiltered();
  },

  _onDataviewFetched: function () {
    this.trigger('dataviewsFetched');
  },

  reload: function (options) {
    options = options || {};
    var successCallback = options.success;
    var errorCallback = options.error;

    options = _.extend({
      includeFilters: true,
      success: function () {
        this.trigger('reloaded');
        successCallback && successCallback();
      }.bind(this),
      error: function () {
        errorCallback && errorCallback();
      }
    }, _.pick(options, 'sourceId', 'forceFetch', 'includeFilters'));

    if (this._instantiateMapWasCalled) {
      this.trigger('reload');
      this._windshaftMap.createInstance(options); // this reload method is call from other places
    }
  },

  _initBindsAfterFirstMapInstantiation: function () {
    this._layersCollection.bind('reset', this._onLayersResetted, this);
    this._layersCollection.bind('add', this._onLayerAdded, this);
    this._layersCollection.bind('remove', this._onLayerRemoved, this);

    if (this._dataviewsCollection) {
      // When new dataviews are defined, a new instance of the map needs to be created
      this._dataviewsCollection.on('add reset remove', _.debounce(this.invalidateSize, 10), this);
      this.listenTo(this._dataviewsCollection, 'add', _.debounce(this._onDataviewAdded.bind(this), 10));
      this.listenTo(this._dataviewsCollection, 'remove', this._onDataviewRemoved);
    }
  },

  _onDataviewRemoved: function (dataviewModel) {
    if (dataviewModel.isFiltered()) {
      this.reload({
        sourceId: dataviewModel.getSourceId()
      });
    }
  },

  _onLayersResetted: function () {
    this.reload();
  },

  _onLayerAdded: function (layerModel, collection, opts) {
    opts = opts || {};
    if (!opts.silent) {
      this.reload({
        sourceId: layerModel.get('id')
      });
    }
  },

  _onLayerRemoved: function (layerModel, collection, opts) {
    opts = opts || {};
    if (!opts.silent) {
      this.reload({
        sourceId: layerModel.get('id')
      });
    }
  },

  _onDataviewAdded: function () {
    this.reload();
  },

  invalidateSize: function () {
    this.trigger('invalidateSize');
  },

  _flattenLayers: function (vizjsonLayers) {
    return _.chain(vizjsonLayers)
      .map(function (vizjsonLayer) {
        if (vizjsonLayer.type === 'layergroup') {
          return vizjsonLayer.options.layer_definition.layers;
        }

        if (vizjsonLayer.type === 'namedmap') {
          // Layers inside of a "namedmap" layer don't have a type, so we need to
          // add manually add it here, so that the factory knows what model should be created.
          return _.map(vizjsonLayer.options.named_map.layers, function (layer) {
            layer.type = 'CartoDB';
            return layer;
          });
        }

        return vizjsonLayer;
      })
      .flatten()
      .value();
  },

  addCustomOverlay: function (overlayView) {
    overlayView.type = 'custom';
    this.overlaysCollection.add(overlayView);
    return overlayView;
  }
});

module.exports = VisModel;
