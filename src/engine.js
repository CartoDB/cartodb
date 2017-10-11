var _ = require('underscore');
var AnalysisPoller = require('./analysis/analysis-poller');
var Backbone = require('backbone');
var CartoDBLayerGroup = require('./geo/cartodb-layer-group');
var DataviewsCollection = require('./dataviews/dataviews-collection');
var LayersCollection = require('./geo/map/layers');

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
 * @param {string} employee.apiKey - Api key used to be autenticate in the windshaft server.
 * @param {string} employee.authToken - Token used to be autenticate in the windshaft server.
 * @param {string} employee.username - Name of the user registered in the windshaft server.
 * @param {string} employee.serverUrl - Url of the windshaft server.
 * @class
 */
function Engine (params) {
  if (!params) throw new Error('new Engine() called with no paramters');
  this._apiKey = params.apiKey;
  this._authToken = params.authToken;
  this._username = params.username;
  this._serverUrl = params.serverUrl;

  // This object will be responsible of triggering the engine events.
  this._eventEmmitter = _.extend({}, Backbone.Events);

  this._analysisPoller = new AnalysisPoller();
  this._layersCollection = new LayersCollection();
  this._dataviewsCollection = new DataviewsCollection();
  this.layerGroupModel = new CartoDBLayerGroup(
    { apiKey: this._apiKey, authToken: this._authToken },
    { layersCollection: this._layersCollection }
  );
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

module.exports = Engine;
