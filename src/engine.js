var _ = require('underscore');
var AnalysisPoller = require('./analysis/analysis-poller');
var AnonymousMapSerializer = require('./windshaft/map-serializer/anonymous-map-serializer/anonymous-map-serializer');
var Backbone = require('backbone');
var CartoDBLayerGroup = require('./geo/cartodb-layer-group');
var DataviewsCollection = require('./dataviews/dataviews-collection');
var LayersCollection = require('./geo/map/layers');
var ModelUpdater = require('./windshaft-integration/model-updater');
var NamedMapSerializer = require('./windshaft/map-serializer/named-map-serializer/named-map-serializer');
var Request = require('./windshaft/request');
var Response = require('./windshaft/response');
var WindshaftClient = require('./windshaft/client');
var AnalysisService = require('./analysis/analysis-service');
var WindshaftError = require('./windshaft/error');

var RELOAD_DEBOUNCE_TIME_IN_MILIS = 100;

/**
 *
 * Creates a new Engine.
 * An engine is the core of a carto app.
 *
 * With the help of external services the engine will:
 *
 *  - Keep the state of the layers and dataviews.
 *  - Serialize the state and send requests to the server.
 *  - Parse the server response and update the internal models.
 *  - Notify errors or successful operations.
 *
 * @param {Object} params - The parameters to initialize the engine.
 * @param {string} params.apiKey - Api key used to be autenticate in the windshaft server.
 * @param {string} params.authToken - Token used to be autenticate in the windshaft server.
 * @param {string} params.username - Name of the user registered in the windshaft server.
 * @param {string} params.serverUrl - Url of the windshaft server.
 * @param {boolean} params.templateName - While we dont remove named maps we must explicitly say when the map is named. Defaults to false.
 * @param {boolean} params.client - Token used to get map view statistics.
 * @constructor
 */
function Engine (params) {
  if (!params) throw new Error('new Engine() called with no parameters');
  this._isNamedMap = params.templateName !== undefined;

  // Variables for the reload debounce
  this._timeout = null;
  this._stackCalls = [];
  this._batchOptions = {};

  this._windshaftSettings = {
    urlTemplate: params.serverUrl,
    userName: params.username,
    client: params.client,
    apiKey: params.apiKey,
    authToken: params.authToken,
    templateName: params.templateName
  };

  this._windshaftClient = new WindshaftClient(this._windshaftSettings);

  // This object will be responsible of triggering the engine events.
  this._eventEmmitter = _.extend({}, Backbone.Events);

  this._analysisPoller = new AnalysisPoller();
  this._layersCollection = new LayersCollection();
  this._dataviewsCollection = new DataviewsCollection();

  this._cartoLayerGroup = new CartoDBLayerGroup(
    { apiKey: params.apiKey, authToken: params.authToken },
    { layersCollection: this._layersCollection }
  );
  this._bindCartoLayerGroupError();

  this._modelUpdater = new ModelUpdater({
    dataviewsCollection: this._dataviewsCollection,
    layerGroupModel: this._cartoLayerGroup,
    layersCollection: this._layersCollection
  });
}

/**
 * Return the cartoLayergroup attached to the engine
 */
Engine.prototype.getLayerGroup = function () {
  return this._cartoLayerGroup;
};

/**
 * Returns the API key attached to the engine
 */
Engine.prototype.getApiKey = function () {
  return this._windshaftSettings && this._windshaftSettings.apiKey;
};

/**
 * Returns the Auth token attached to the engine
 */
Engine.prototype.getAuthToken = function () {
  return this._windshaftSettings && this._windshaftSettings.authToken;
};

/**
 * Bind a callback function to an event. The callback will be invoked whenever the event is fired.
 *
 * @param {string} event - The name of the event that triggers the callback execution.
 * @param {function} callback - A function to be executed when the event is fired.
 * @param {function} [context] - The context value for this when the callback is invoked.
 * @example
 * // Define a callback to be executed once the map is reloaded.
 * function onReload(event) {
 *  console.log(event); // "reload-success"
 * }
 * // Attach the callback to the RELOAD_SUCCESS event.
 * engine.on(Engine.Events.RELOAD_SUCCESS, onReload);
 * // Call the reload method and wait.
 * engine.reload();
 *
 */
Engine.prototype.on = function (event, callback, context) {
  this._eventEmmitter.on(event, callback, context);
};

/**
 * Remove a previously-bound callback function from an event.
 *
 * @param {string} event - The name of the event that triggers the callback execution.
 * @param {function} callback - A function callback to be removed when the event is fired.
 * @param {function} [context] - The context value for this when the callback is invoked.
 * @example
 * // Remove the the `displayMap` listener function so it wont be executed anymore when the engine fires the `load` event.
 * engine.off(Engine.Events.RELOAD_SUCCESS, onReload);
 *
 */
Engine.prototype.off = function (event, callback, context) {
  this._eventEmmitter.off(event, callback, context);
};

/**
 * This is the most important function of the engine.
 * Generate a payload from the current state, send it to the windshaft server
 * and update the internal models with the server response.
 *
 * Once the response has arrived trigger a 'reload-succes' or 'reload-error' event.
 *
 * @param {string} options.sourceId - The sourceId triggering the reload event. This is usefull to prevent uneeded requests and save data.
 * @param {boolean} options.forceFetch - Forces dataviews to fetch data from server after a reload
 * @param {boolean} options.includeFilters - Boolean flag to control if the filters need to be added in the payload.
 *
 * @fires Engine#Engine:RELOAD_STARTED
 * @fires Engine#Engine:RELOAD_SUCCESS
 * @fires Engine#Engine:RELOAD_ERROR
 *
 */
Engine.prototype.reload = function (options) {
  options = options || {};
  // Using a debouncer to optimize consecutive calls to reload the map.
  // This allows to change multiple map parameters reloading the map only once,
  // and therefore avoid the "You are over platform's limits" Windshaft error.
  return new Promise(function (resolve, reject) {
    this._batchOptions = _.pick({
      sourceId: options.sourceId,
      forceFetch: this._batchOptions.forceFetch || options.forceFetch,
      includeFilters: options.includeFilters
    }, _.negate(_.isUndefined));
    this._stackCalls.push({
      success: options.success,
      error: options.error,
      resolve: resolve,
      reject: reject
    });
    var later = function () {
      this._timeout = null;
      this._performReload(this._batchOptions)
        .then(function () {
          // Resolve stacked callbacks and promises
          this._stackCalls.forEach(function (call) {
            call.success && call.success();
            call.resolve();
          });
          // Reset stack
          this._stackCalls = [];
          this._batchOptions = {};
        }.bind(this))
        .catch(function (windshaftError) {
          // Reject stacked callbacks and promises
          this._stackCalls.forEach(function (call) {
            call.error && call.error(windshaftError);
            call.reject(windshaftError);
          });
          // Reset stack
          this._stackCalls = [];
          this._batchOptions = {};
        }.bind(this));
    }.bind(this);
    clearTimeout(this._timeout);
    this._timeout = setTimeout(later, RELOAD_DEBOUNCE_TIME_IN_MILIS);
  }.bind(this));
};

Engine.prototype._performReload = function (options) {
  return new Promise(function (resolve, reject) {
    // Build Windshaft options callbacks
    var windshaftOptions = this._buildWindshaftOptions(options,
      // Windshaft success callback
      function (serverResponse) {
        this._onReloadSuccess(serverResponse, options.sourceId, options.forceFetch);
        resolve();
      }.bind(this),
      // Windshaft error callback
      function (errors) {
        var windshaftError = this._onReloadError(errors);
        reject(windshaftError);
      }.bind(this)
    );
    try {
      var params = this._buildParams(windshaftOptions.includeFilters);
      var payload = this._getSerializer().serialize(this._layersCollection, this._dataviewsCollection);
      var request = new Request(payload, params, windshaftOptions);

      // Trigger STARTED event
      this._eventEmmitter.trigger(Engine.Events.RELOAD_STARTED);
      // Perform the request
      this._windshaftClient.instantiateMap(request);
    } catch (error) {
      // Convert error in a windshaftError
      var windshaftError = new WindshaftError({ message: error.message });
      this._manageClientError(windshaftError, windshaftOptions);
    }
  }.bind(this));
};

/**
 *
 * Add a layer to the engine layersCollection
 *
 * @param {layer} layer - A new layer to be added to the engine.
 *
 * @public
 */
Engine.prototype.addLayer = function (layer) {
  this._layersCollection.add(layer);
};

/**
 *
 * Remove a layer from the engine layersCollection
 *
 * @param {layer} layer - A new layer to be removed from the engine.
 *
 * @public
 */
Engine.prototype.removeLayer = function (layer) {
  this._layersCollection.remove(layer);
};

/**
 *
 * Move a layer in the engine layersCollection
 *
 * @param {layer} layer - A new layer to be moved in the engine.
 * @param {number} toIndex - Final index for the layer.
 *
 * @public
 */
Engine.prototype.moveLayer = function (layer, toIndex) {
  var fromIndex = this._layersCollection.indexOf(layer);
  if (fromIndex >= 0 && fromIndex !== toIndex) {
    this._layersCollection.models.splice(toIndex, 0, this._layersCollection.models.splice(fromIndex, 1)[0]);
    // Equivalent to:
    // this._layersCollection.remove(layer, { silent: true });
    // this._layersCollection.add(layer, { at: toIndex });
  }
};

/**
 *
 * Add a dataview to the engine dataviewsCollection
 *
 * @param {Dataview} dataview - A new dataview to be added to the engine.
 *
 * @public
 */
Engine.prototype.addDataview = function (dataview) {
  this._dataviewsCollection.add(dataview);
};

/**
 *
 * Remove a dataview from the engine dataviewsCollection
 *
 * @param {Dataview} dataview - The Dataview to be removed to the engine.
 *
 * @public
 */
Engine.prototype.removeDataview = function (dataview) {
  this._dataviewsCollection.remove(dataview);
};

/**
 * Callback executed when the windhsaft client returns a successful response.
 * Update internal models and trigger a RELOAD_SUCCESS event.
 * @private
 */
Engine.prototype._onReloadSuccess = function (serverResponse, sourceId, forceFetch) {
  var responseWrapper = new Response(this._windshaftSettings, serverResponse);
  this._modelUpdater.updateModels(responseWrapper, sourceId, forceFetch);
  this._restartAnalysisPolling();
  // Trigger RELOAD_SUCCESS event
  this._eventEmmitter.trigger(Engine.Events.RELOAD_SUCCESS);
};

/**
 * Callback executed when the windhsaft client returns a failed response.
 * Update internal models setting errors and trigger a RELOAD_ERROR event.
 * @private
 */
Engine.prototype._onReloadError = function (errors) {
  var windshaftError = this._getSimpleWindshaftError(errors);
  this._modelUpdater.setErrors(errors);
  // Trigger RELOAD_ERROR event
  this._eventEmmitter.trigger(Engine.Events.RELOAD_ERROR, windshaftError);
  return windshaftError;
};

/**
 * Helper to get windhsaft request options.
 * @private
 */
Engine.prototype._buildWindshaftOptions = function (options, successCallback, errorCallback) {
  return _.extend({
    includeFilters: true,
    success: successCallback,
    error: errorCallback
  }, _.pick(options, 'sourceId', 'forceFetch', 'includeFilters'));
};

/**
 * Helper to get windhsaft request parameters.
 * @param {boolean} includeFilters - Boolean flag to control if the filters need to be added in the payload.
 * @private
 */
Engine.prototype._buildParams = function (includeFilters) {
  var params = {};

  if (__ENV__ === 'production') {
    params.client = this._windshaftSettings.client;
  }

  if (includeFilters && !_.isEmpty(this._dataviewsCollection.getFilters())) {
    params.filters = this._dataviewsCollection.getFilters();
  }

  if (this._windshaftSettings.apiKey) {
    params.api_key = this._windshaftSettings.apiKey;
    return params;
  }

  if (this._windshaftSettings.authToken) {
    params.auth_token = this._windshaftSettings.authToken;
    return params;
  }

  console.warn('Engine initialized with no apiKeys neither authToken');
};

/**
 * Reset the analysis nodes in the poller
 * @private
 */
Engine.prototype._restartAnalysisPolling = function () {
  var analysisNodes = AnalysisService.getUniqueAnalysisNodes(this._layersCollection, this._dataviewsCollection);
  this._analysisPoller.resetAnalysisNodes(analysisNodes);
};

/**
 * Get the instance of the serializer service depending on is an anonymous or a named map.
 * @private
 */
Engine.prototype._getSerializer = function () {
  return this._isNamedMap ? NamedMapSerializer : AnonymousMapSerializer;
};

/**
 * Manage and propagate the client error
 * @private
 */
Engine.prototype._manageClientError = function (windshaftError, windshaftOptions) {
  this._modelUpdater.setErrors([windshaftError]);
  windshaftOptions.error && windshaftOptions.error([windshaftError]);
};

/**
 * Listen to errors in cartoLayerGroup
 */
Engine.prototype._bindCartoLayerGroupError = function () {
  this._cartoLayerGroup.on('all', function (change, error) {
    if (change.lastIndexOf('error:', 0) === 0) {
      error = new WindshaftError(error);
      this._eventEmmitter.trigger(Engine.Events.LAYER_ERROR, error);
    }
  }, this);
};

Engine.prototype._getSimpleWindshaftError = function (errors) {
  var error = _.find(errors, function (error) { return error.isGlobalError(); });
  if (!error && errors && errors.length > 0) {
    error = errors[0];
  }
  return error;
};

/**
 * Events fired by the engine
 *
 * @readonly
 * @enum {string}
 */
Engine.Events = {
  /**
   * Reload started event, fired every time the reload process starts.
   */
  RELOAD_STARTED: 'reload-started',
  /**
   * Reload success event, fired every time the reload function succeed.
   */
  RELOAD_SUCCESS: 'reload-success',
  /**
   * Reload error event, fired every time the reload function fails.
   */
  RELOAD_ERROR: 'reload-error',
  /**
   * Error event, fired every time a tile or limit error happens.
   */
  LAYER_ERROR: 'layer-error'
};

module.exports = Engine;

/**
 * Reload started event, fired every time the reload process starts.
 *
 * @event Engine#Engine:RELOAD_STARTED
 * @type {string}
 */

/**
  * Reload success event, fired every time the reload function succeed.
  *
  * @event Engine#Engine:RELOAD_SUCCESS
  * @type {string}
  */

/**
  * Reload success event, fired every time the reload function fails.
  *
  * @event Engine#Engine:RELOAD_ERROR
  * @type {string}
  */

/**
  * Layer group error event, fired every time an error with layer group happends (tile or limit).
  *
  * @event Engine#Engine:LAYER_ERROR
  * @type {string}
  */
