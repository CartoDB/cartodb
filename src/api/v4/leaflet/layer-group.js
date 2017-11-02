var FeatureEvent = require('../events/feature-event');
var LeafletCartoLayerGroupView = require('../../../geo/leaflet/leaflet-cartodb-layer-group-view');

function LayerGroup (layers, engine) {
  this._layers = layers;
  this._engine = engine;
  this._internalLayerGroupView = undefined;
}

LayerGroup.prototype.addTo = function (map) {
  this._internalLayerGroupView = this._internalLayerGroupView ||
    this._createInternalLayerGroupView(map);

  if (!map.hasLayer(this._internalLayerGroupView.leafletLayer)) {
    this._internalLayerGroupView.leafletLayer.addTo(map);
  }
};

LayerGroup.prototype._createInternalLayerGroupView = function (map) {
  var leafletLayerGroupView = new LeafletCartoLayerGroupView(this._engine._cartoLayerGroup, map);

  leafletLayerGroupView.on('featureClick', this._onFeatureClick, this);
  leafletLayerGroupView.on('featureOver', this._onFeatureOver, this);
  leafletLayerGroupView.on('featureOut', this._onFeatureOut, this);

  return leafletLayerGroupView;
};

LayerGroup.prototype._onFeatureClick = function (internalEvent) {
  this._triggerLayerFeatureEvent('feature:click', internalEvent);
};

LayerGroup.prototype._onFeatureOver = function (internalEvent) {
  this._triggerLayerFeatureEvent('feature:over', internalEvent);
};

LayerGroup.prototype._onFeatureOut = function (internalEvent) {
  this._triggerLayerFeatureEvent('feature:out', internalEvent);
};

LayerGroup.prototype._triggerLayerFeatureEvent = function (eventName, internalEvent) {
  var layer = this._layers.findById(internalEvent.layer.id);
  if (layer) {
    var event = FeatureEvent.createFromInternalFeatureEvent(internalEvent, layer);
    layer.trigger(eventName, event);
  }
};
module.exports = LayerGroup;
