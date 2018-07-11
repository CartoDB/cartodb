var _ = require('underscore');
var Backbone = require('backbone');
var util = require('../core/util');
var Map = require('../geo/map');
var DataviewsFactory = require('../dataviews/dataviews-factory');
var AnalysisService = require('../analysis/analysis-service');
var LayersFactory = require('./layers-factory');
var SettingsModel = require('./settings');
var whenAllDataviewsFetched = require('./dataviews-tracker');
var RenderModes = require('../geo/render-modes');
var Engine = require('../engine');

var STATE_INIT = 'init'; // vis hasn't been sent to Windshaft
var STATE_OK = 'ok'; // vis has been sent to Windshaft and everything is ok
var STATE_ERROR = 'error'; // vis has been sent to Windshaft and there were some issues

var VisModel = Backbone.Model.extend({
  defaults: {
    loading: false,
    showEmptyInfowindowFields: false,
    showLimitErrors: false,
    state: STATE_INIT
  },

  initialize: function () {
    this._loadingObjects = [];
    this.overlaysCollection = new Backbone.Collection();
    this.settings = new SettingsModel();
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
    var windshaftSettings = {
      urlTemplate: vizjson.datasource.maps_api_template,
      userName: vizjson.datasource.user_name,
      client: vizjson.datasource.client,
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken'),
      templateName: vizjson.datasource.template_name
    };

    this._engine = this._createEngine(windshaftSettings);

    this._engine.on(Engine.Events.RELOAD_SUCCESS, this._onEngineReloadSuccess, this);
    this._engine.on(Engine.Events.RELOAD_ERROR, this._onEngineReloadError, this);
    this._engine.on(Engine.Events.LAYER_ERROR, this._onEngineLayerError, this);

    // Bind layerGroupModel object to engine
    this.layerGroupModel = this._engine._cartoLayerGroup;

    // Create the public Analysis Service
    this._analysisService = new AnalysisService({
      engine: this._engine,
      apiKey: windshaftSettings.apiKey,
      authToken: windshaftSettings.authToken
    });

    // Public wrapper exposing public methods.
    this.analysis = {
      analyse: this._analysisService.analyse.bind(this._analysisService),
      findNodeById: this._analysisService.findNodeById.bind(this._analysisService)
    };

    var allowScrollInOptions = (vizjson.options && vizjson.options.scrollwheel) || vizjson.scrollwheel;
    var allowDragging = util.isMobileDevice() || vizjson.hasZoomOverlay() || allowScrollInOptions;

    var renderMode = RenderModes.AUTO;
    if (vizjson.vector === true) {
      renderMode = RenderModes.VECTOR;
    } else if (vizjson.vector === false) {
      renderMode = RenderModes.RASTER;
    }

    this.layersFactory = new LayersFactory({ engine: this._engine, windshaftSettings: windshaftSettings });

    this.map = new Map({
      title: vizjson.title,
      description: vizjson.description,
      bounds: vizjson.bounds,
      center: vizjson.center,
      zoom: vizjson.zoom,
      scrollwheel: !!allowScrollInOptions,
      drag: allowDragging,
      provider: vizjson.map_provider,
      isFeatureInteractivityEnabled: this.get('interactiveFeatures'),
      renderMode: renderMode
    }, {
      layersCollection: this._layersCollection,
      layersFactory: this.layersFactory
    });

    this.listenTo(this.map, 'cartodbLayerMoved', this.reload);

    // Reset the collection of overlays
    this.overlaysCollection.reset(vizjson.overlays);

    // Create the public Dataview Factory
    // TODO: create dataviews more explicitly
    this.dataviews = new DataviewsFactory({}, {
      map: this.map,
      engine: this._engine,
      dataviewsCollection: this._dataviewsCollection
    });

    // Create layers
    var analysisNodes = this._createAnalysisNodes(vizjson.analyses);
    var layerModels = this._createLayers(vizjson.layers, analysisNodes);
    this.map.layers.reset(layerModels);

    // Global variable for easier console debugging / testing
    window.vis = this;

    _.defer(function () {
      this.trigger('load', this);
    }.bind(this));
  },

  _createEngine: function (windshaftSettings) {
    var engine = new Engine({
      apiKey: windshaftSettings.apiKey,
      authToken: windshaftSettings.authToken,
      username: windshaftSettings.userName,
      serverUrl: windshaftSettings.urlTemplate,
      templateName: windshaftSettings.templateName,
      client: windshaftSettings.client
    });

    // TODO: Use engine.layerscollection in every reference
    this._layersCollection = engine._layersCollection;
    this._dataviewsCollection = engine._dataviewsCollection;

    return engine;
  },

  /**
   * Return the engine for this visModel
   */
  getEngine: function () {
    return this._engine;
  },

  // we provide a method to set some new settings
  setSettings: function (settings) {
    this.settings.set(settings);
  },

  /**
   * Check if an analysis is the source of any layer.
   */
  _isAnalysisLinkedToLayer: function (analysisModel) {
    return this._layersCollection.any(function (layerModel) {
      return layerModel.hasSource(analysisModel);
    });
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
        this._onMapInstantiatedForTheFirstTime();
        options.success && options.success();
      }.bind(this),
      error: function (error) {
        options.error && options.error(error && error.message);
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

  _onEngineReloadSuccess: function () {
    this.trigger('reloaded');
    var analysisNodes = AnalysisService.getUniqueAnalysisNodes(this._layersCollection, this._dataviewsCollection);
    this._isAnyAnalysisNodeLoading(analysisNodes) ? this.trackLoadingObject(this) : this.untrackLoadingObject(this);
    this.setOk();
  },

  _onEngineReloadError: function (error) {
    if (error && error.isGlobalError && error.isGlobalError()) {
      this.setError(error);
    }
  },

  _onEngineLayerError: function (error) {
    if (error) {
      this.map.trigger('error:' + error.type, error);
    }
  },

  reload: function (options) {
    if (this._instantiateMapWasCalled) {
      this.trigger('reload');
      return this._engine.reload(options);
    }
    return Promise.resolve();
  },

  _isAnyAnalysisNodeLoading: function (analysisNodes) {
    return _.any(analysisNodes, function (analysisModel) {
      return analysisModel.isLoading();
    });
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

  addCustomOverlay: function (overlayView) {
    overlayView.type = 'custom';
    this.overlaysCollection.add(overlayView);
    return overlayView;
  },

  isLoading: function () {
    return this.get('loading');
  },

  /**
   * "Load" existing analyses from the viz.json. This will generate
   * the analyses graphs and index analysis nodes in the
   * collection of analysis
   */
  _createAnalysisNodes: function (analysesDefinition) {
    _.each(analysesDefinition, function (analysisDefinition) {
      this._analysisService.analyse(analysisDefinition);
    }, this);
  },

  _createLayers: function (layersDefinition, analysisNodes) {
    var layers = _.map(layersDefinition, function (layerData, layerIndex) {
      // Flatten "options" and set the "order" attribute
      layerData = _.extend({},
        _.omit(layerData, 'options'),
        layerData.options, {
          order: layerIndex
        }
      );

      if (layerData.source) {
        layerData.source = this._analysisService.findNodeById(layerData.source);
      } else {
        // TODO: We'll be able to remove this (accepting sql option) once
        // https://github.com/CartoDB/cartodb.js/issues/1754 is closed.
        if (layerData.sql) {
          layerData.source = this._analysisService.createAnalysisForLayer(layerData.id, layerData.sql);
          delete layerData.sql;
        }
      }
      return this.layersFactory.createLayer(layerData.type, layerData);
    }, this);
    return layers;
  }
});

module.exports = VisModel;
