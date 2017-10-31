var Engine = require('../../engine');
var LeafletCartoLayerGroupView = require('../../geo/leaflet/leaflet-cartodb-layer-group-view');
/**
 * 
 * @param {object} settings 
 */
function Client (settings) {
  this._engine = new Engine({
    apiKey: settings.apiKey,
    authToken: settings.authToken, // Deprecated
    serverUrl: settings.serverUrl,
    statTag: settings.statTag, // Deprecated ?
    templateName: settings.templateName, // Deprecated
    username: settings.username
  });
}

Client.prototype.on = function () {

};

Client.prototype.addLayer = function (layer, opts) {
  opts = opts || {};
  layer.$setEngine(this._engine);
  this._engine.addLayer(layer.$getInternalModel());
  if (opts.reload === false) {
    return Promise.resolve();
  }
  return this._engine.reload();
};

Client.prototype.addLayers = function () {

};

Client.prototype.removeLayer = function () {

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
