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
 * @param {boolean} params.statTag - Token used to get map view statistics.
 * @class
 * @api
 */
function Engine (params) {
  if (!params) throw new Error('new Engine() called with no paramters');
  this._isNamedMap = params.templateName !== undefined;
  this._windshaftSettings = {
    urlTemplate: params.serverUrl,
    userName: params.username,
    statTag: params.statTag,
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

  this._layerGroupModel = new CartoDBLayerGroup(
    { apiKey: params.apiKey, authToken: params.authToken },
    { layersCollection: this._layersCollection }
  );

  this._modelUpdater = new ModelUpdater({
    dataviewsCollection: this._dataviewsCollection,
    layerGroupModel: this._layerGroupModel,
    layersCollection: this._layersCollection
  });
}

/**
 * Bind a callback function to an event. The callback will be invoked whenever the event is fired.
 * 
 * @param {string} event - The name of the event that triggers the callback execution.
 * @param {function} callback - A function to be executed when the event is fired.
 * 
 * @example
 * 
 * // Define a callback to be executed once the map is reloaded.
 * function onReload(event) {
 *  console.log(event); // "reload-success"
 * }
 * 
 * // Attach the callback to the RELOAD_SUCCESS event.
 * engine.on(Engine.Events.RELOAD_SUCCESS, onReload);
 * 
 * // Call the reload method and wait.
 * engine.reload();
 *
 * @api
 */
Engine.prototype.on = function on (event, callback) {
  this._eventEmmitter.on(event, callback);
};

/**
 * Remove a previously-bound callback function from an event.
 * 
 * @param {string} event - The name of the event that triggers the callback execution.
 * @param {function} callback - A function callback to be removed when the event is fired.
 * 
 * @example
 * 
 * // Remove the the `displayMap` listener function so it wont be executed anymore when the engine fires the `load` event.
 * engine.off(Engine.Events.RELOAD_SUCCESS, onReload);
 * 
 * @api
 */
Engine.prototype.off = function off (event, callback) {
  this._eventEmmitter.off(event, callback);
};

/**
 * This is the most important function of the engine.
 * Generate a payload from the current state, send it to the windshaft server
 * and update the internal models with the server response.
 * 
 * Once the response has arrived trigger a 'reload-succes' or 'reload-error' event.
 * 
 * @param {string} sourceId - The sourceId triggering the reload event. This is usefull to prevent uneeded requests and save data.
 * @param {string} forceFetch - ????
 * 
 * @fires Engine#Engine:RELOAD_SUCCESS
 * @fires Engine#Engine:RELOAD_ERROR
 * 
 * @api
 */
Engine.prototype.reload = function reload (sourceId, forceFetch) {
  var params = this._getParams(sourceId, forceFetch);
  var payload = this._getSerializer().serialize(this._layersCollection, this._dataviewsCollection);
  // TODO: update options, use promises or explicit callbacks function (error, params).
  var options = this._buildOptions(sourceId, forceFetch);
  var request = new Request(payload, params, options);
  this._windshaftClient.instantiateMap(request);
};

/**
 * 
 * Add a layer to the engine layersCollection
 * 
 * @param {layer} layer - A new layer to be added to the engine.
 * 
 * @public
 * @api
 */
Engine.prototype.addLayer = function addLayer (layer) {
  this._layersCollection.add(layer);
};

/**
 * 
 * Add a dataview to the engine dataviewsCollection
 * 
 * @param {Dataview} dataview - A new dataview to be added to the engine.
 * 
 * @public
 * @api
 */
Engine.prototype.addDataview = function addDataview (dataview) {
  this._dataviewsCollection.add(dataview);
};

/**
 * Callback executed when the windhsaft client returns a successful response.
 * Update internal models and trigger a reload_sucess event.
 * @private
 */
Engine.prototype._onReloadSuccess = function _onReloadSuccess (serverResponse, sourceId, forceFetch) {
  var responseWrapper = new Response(this._windshaftSettings, serverResponse);
  this._modelUpdater.updateModels(responseWrapper, sourceId, forceFetch);
  this._eventEmmitter.trigger(Engine.Events.RELOAD_SUCCESS);
};

/**
 * Callback executed when the windhsaft client returns a failed response.
 * Update internal models setting errores and trigger a reload_error event.
 * @private
 */
Engine.prototype._onReloadError = function _onReloadError (serverResponse) {
  var errors = serverResponse;
  this._modelUpdater.setErrors(errors);
  this._eventEmmitter.trigger(Engine.Events.RELOAD_ERROR);
};

/**
 * @private
 */
Engine.prototype._buildOptions = function _buildOptions (sourceId, forceFetch) {
  return {
    success: function (serverResponse) {
      this._onReloadSuccess(serverResponse, sourceId, forceFetch);
    }.bind(this),
    error: this._onReloadError.bind(this)
  };
};

/**
 * Helper to get windhsaft request parameters.
 * @private
 */
Engine.prototype._getParams = function _getParams () {
  var params = {
    stat_tag: this._windshaftSettings.statTag
  };
  if (this._windshaftSettings.apiKey) {
    params.api_key = this._windshaftSettings.apiKey;
    return params;
  }
  if (this._windshaftSettings.authToken) {
    params.auth_token = this._windshaftSettings.authToken;
    return params;
  }
};

/**
 * Get the instance of the serializer service depending on is an anonymous or a named map.
 * @private
 */
Engine.prototype._getSerializer = function _getSerializer () {
  return this._isNamedMap ? NamedMapSerializer : AnonymousMapSerializer;
};

/**
 * Events fired by the engine
 *
 * @readonly
 * @enum {string}
 * @api
 */
Engine.Events = {
  /**
   * Reload success event, fired every time the reload function succeed.
   */
  RELOAD_SUCCESS: 'reload-success',
  /**
   * Reload success event, fired every time the reload function fails.
   */
  RELOAD_ERROR: 'reload-error'
};

module.exports = Engine;

/**
  * Reload success event, fired every time the reload function succeed.
  *
  * @event Engine#Engine:RELOAD_SUCCESS
  * @type {string}
  * @api
  */

/**
  * Reload success event, fired every time the reload function fails.
  *
  * @event Engine#Engine:RELOAD_ERROR
  * @type {string}
  * @api
  */
