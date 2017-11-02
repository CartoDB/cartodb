var Events = require('./events');
var Engine = require('../../engine');
var Layers = require('./layers');
var LeafletLayerGroup = require('./leaflet/layer-group');

/**
 * This is the main object in a Carto.js application. 
 * 
 * The carto client keeps both layer and dataview lists internaly. Every time some layer/dataview changes
 * the client will trigger a carto-reload cycle.
 * 
 * @param {object} settings 
 * @param {string} settings.apiKey - Api key used to be autenticate in the windshaft server.
 * @param {string} settings.username - Name of the user registered in the windshaft server.
 * @param {string} settings.serverUrl - Url of the windshaft server.
 * @param {boolean} settings.statTag - Token used to get map view statistics.
 * 
 * @constructor
 * @api
 * @memberof carto
 * 
 * @fires carto.Events.SUCCESS
 * @fires carto.Events.ERROR
 */
function Client (settings) {
  this._layers = new Layers();
  this._engine = new Engine({
    apiKey: settings.apiKey,
    authToken: settings.authToken, // Deprecated
    serverUrl: settings.serverUrl,
    statTag: settings.statTag, // Deprecated ?
    templateName: settings.templateName, // Deprecated
    username: settings.username
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
 * client.on(client.Events.SUCCESS, onReload);
 * @api
 */
Client.prototype.on = function (event, callback) {
  switch (event) {
    case Events.SUCCESS:
      this._engine.on(Engine.Events.RELOAD_SUCCESS, callback);
      return this;
    case Events.ERROR:
      this._engine.on(Engine.Events.RELOAD_ERROR, callback);
      return this;
    default:
      throw new Error('Unrecognized event: ' + event);
  }
};

/**
 * Add a layer to the client.
 * 
 * @param {carto.layer.Layer} - The layer to be added
 * @param {object} opts
 * @param {boolean} opts.reload - Default: true. A boolean flag controlling if the client should be reloaded
 * 
 * @returns {Promise} - A promise that will be fulfilled when the reload cycle is completed.
 * @api
 */
Client.prototype.addLayer = function (layer, opts) {
  return this.addLayers([layer], opts);
};

/**
 * Add a layer array to the client.
 * 
 * @param {carto.layer.Layer[]} - The layer array to be added
 * @param {object} opts
 * @param {boolean} opts.reload - Default: true. A boolean flag controlling if the client should be reloaded
 * 
 * @returns {Promise} A promise that will be fulfilled when the reload cycle is completed.
 * @api
 */
Client.prototype.addLayers = function (layers, opts) {
  opts = opts || {};
  layers.forEach(this._addLayer, this);
  if (opts.reload === false) {
    return Promise.resolve();
  }
  return this._engine.reload();
};

/**
 * Remove a layer from the client
 * 
 * @param {carto.layers.Layer} - The layer array to be removed
 * @param {object} opts
 * @param {boolean} opts.reload - Default: true. A boolean flag controlling if the client should be reloaded
 * 
 * @returns {Promise} A promise that will be fulfilled when the reload cycle is completed.
 * @api
 */
Client.prototype.removeLayer = function (layer, opts) {
  opts = opts || {};
  this._layers.remove(layer);
  this._engine.removeLayer(layer.$getInternalModel());
  if (opts.reload === false) {
    return Promise.resolve();
  }
  return this._engine.reload();
};

/**
 * Get all the layers from the client
 * 
 * @returns {carto.layer.Layer[]} An array with all the Layers from the client.
 * @api
 */
Client.prototype.getLayers = function () {
  return this._layers.toArray();
};

/**
 * ...
 */
Client.prototype.getLeafletLayerView = function () {
  this._leafletLayer = this._leafletLayer || new LeafletLayerGroup(this._layers, this._engine);
  return this._leafletLayer;
};

/**
 * Helper used to link a layer and an engine.
 * @private
 */
Client.prototype._addLayer = function (layer, engine) {
  this._layers.add(layer);
  layer.$setEngine(this._engine);
  this._engine.addLayer(layer.$getInternalModel());
};

module.exports = Client;
