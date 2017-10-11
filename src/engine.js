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
var WindshaftClient = require('./windshaft/client');

/**
 *
 * Creates a new Engine.
 * An engine is the core of a carto app.
 *
 * With the help of external services the engine will:
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
 * @class
 */
function Engine (params) {
  if (!params) throw new Error('new Engine() called with no paramters');
  this._apiKey = params.apiKey;
  this._authToken = params.authToken;
  this._username = params.username;
  this._serverUrl = params.serverUrl;
  this._templateName = params.templateName;
  this._isNamedMap = params.templateName !== undefined;
  this._stat_tag;

  // Create the client
  var windshaftSettings = {
    urlTemplate: this._serverUrl,
    userName: this._username,
    statTag: this._stat_tag,
    apiKey: this._apiKey,
    authToken: this._authToken,
    templateName: this._templateName
  };

  this._windshaftClient = new WindshaftClient(windshaftSettings);

  // This object will be responsible of triggering the engine events.
  this._eventEmmitter = _.extend({}, Backbone.Events);

  this._analysisPoller = new AnalysisPoller();
  this._layersCollection = new LayersCollection();
  this._dataviewsCollection = new DataviewsCollection();
  this.layerGroupModel = new CartoDBLayerGroup(
    { apiKey: this._apiKey, authToken: this._authToken },
    { layersCollection: this._layersCollection }
  );

  // TODO: this is not working.
  this._modelUpdater = new ModelUpdater({
    dataviewsCollection: this._dataviewsCollection,
    layerGroupModel: this.layerGroupModel,
    layersCollection: this._layersCollection,
    mapModel: {},
    visModel: { setOk: function () { }, setErrors: function () { } }
  });
}

/**
 * Bind a callback function to an event. The callback will be invoked whenever the event is fired.
 * 
 * @param {string} event - The name of the event that triggers the callback execution.
 * @param {function} callback - A function to be executed when the event is fired.
 * 
 * @example
 * // Execute the `displayMap` function when the engine fires the load event.
 * engine.on('load', displayMap);
 */
Engine.prototype.on = function on (event, callback) {
  this._eventEmmitter.on(event, callback);
};

/**
 * Remove a previously-bound callback function from an event.
 * 
 * @param {string} event - The name of the event that triggers the callback execution.
 * @param {function} callback - A function to be executed when the event is fired.
 * 
 * * @example
 * // Remove the the `displayMap` listener function so it wont be executed anymore when the engine fires the `load` event.
 * engine.off('load', displayMap);
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
 */
Engine.prototype.reload = function reload () {
  var params; // TODO: 
  var payload = this._getSerializer().serialize(this._layersCollection, this._dataviewsCollection);
  var options = { success: this._onSuccess.bind(this), error: this._onError.bind(this) };
  var request = new Request(payload, params, options);
  this._windshaftClient.instantiateMap(request);
  // TODO: update options, use promises or explicit callbacks function (error, params).
};

/**
 * @api
 * @public
 * 
 * Add a layer to the engine layersCollection
 * 
 * @param {layer} layer - A new layer to be added to the engine.
 */
Engine.prototype.addLayer = function addLayer (layer) {
  this._layersCollection.add(layer);
};

/**
 * @private
 * Callback executed when the windhsaft client returns a successful response.
 * Update internal models and trigger a reload_sucess event.
 */
Engine.prototype._onSuccess = function onSuccess (serverResponse) {
  this._modelUpdater.updateModels(serverResponse, this.layersCollection, this.dataviewsCollection, this.cartoDBLayerGroup);
  this._eventEmmitter.trigger(Engine.Events.RELOAD_SUCCESS);
};

/**
 * @private
 * Callback executed when the windhsaft client returns a failed response.
 * Update internal models setting errores and trigger a reload_error event.
 */
Engine.prototype._onError = function onError (serverResponse) {
  var errors = serverResponse;
  this._modelUpdater.setErrors(errors);
  this._eventEmmitter.trigger(Engine.Events.RELOAD_ERROR);
};

/**
 * @private
 * Get the instance of the serializer service depending on is an anonymous or a named map.
 */
Engine.prototype._getSerializer = function _getSerializer () {
  return this._isNamedMap ? NamedMapSerializer : AnonymousMapSerializer;
};

// Public "enum" with the events generated by the engine
Engine.Events = {
  RELOAD_SUCCESS: 'reload-success',
  RELOAD_ERROR: 'reload-error'
};

module.exports = Engine;
