var Events = require('./events');
var Engine = require('../../engine');
var LeafletCartoLayerGroupView = require('../../geo/leaflet/leaflet-cartodb-layer-group-view');
/**
 * 
 * @param {object} settings 
 */
function Client (settings) {
  this._layers = [];
  this._engine = new Engine({
    apiKey: settings.apiKey,
    authToken: settings.authToken, // Deprecated
    serverUrl: settings.serverUrl,
    statTag: settings.statTag, // Deprecated ?
    templateName: settings.templateName, // Deprecated
    username: settings.username
  });
}

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

Client.prototype.addLayer = function (layer, opts) {
  return this.addLayers([layer], opts);
};

Client.prototype.addLayers = function (layers, opts) {
  opts = opts || {};
  layers.forEach(this._addLayer, this);
  if (opts.reload === false) {
    return Promise.resolve();
  }
  return this._engine.reload();
};

Client.prototype._addLayer = function (layer, engine) {
  this._layers.push(layer);
  layer.$setEngine(this._engine);
  this._engine.addLayer(layer.$getInternalModel());
};

Client.prototype.removeLayer = function (layer, opts) {
  opts = opts || {};
  this._layers.splice(this._layers.indexOf(layer));
  this._engine.removeLayer(layer.$getInternalModel());
  if (opts.reload === false) {
    return Promise.resolve();
  }
  return this._engine.reload();
};

Client.prototype.getLayers = function () {

};

Client.prototype.getLeafletLayerView = function () {
  return {
    addTo: function (map) {
      var leafletCartoLayerGroupView = new LeafletCartoLayerGroupView(this._engine._cartoLayerGroup, map);
      leafletCartoLayerGroupView.leafletLayer.addTo(map);
    }.bind(this)
  };
};

module.exports = Client;
