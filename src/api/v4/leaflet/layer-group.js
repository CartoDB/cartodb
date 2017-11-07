var Layer = require('../layer/');
var LeafletCartoLayerGroupView = require('../../../geo/leaflet/leaflet-cartodb-layer-group-view');

function LayerGroup (layers, engine) {
  this._layers = layers;
  this._engine = engine;
  this._leafletMap = undefined;
  this._internalLayerGroupView = undefined;
}

LayerGroup.prototype.addTo = function (map) {
  this._internalLayerGroupView = this._internalLayerGroupView ||
    this._createInternalLayerGroupView(map);

  if (!map.hasLayer(this._internalLayerGroupView.leafletLayer)) {
    this._leafletMap = map;
    this._internalLayerGroupView.leafletLayer.addTo(map);
  }
};

LayerGroup.prototype.removeFrom = function (map) {
  if (this._internalLayerGroupView) {
    this._internalLayerGroupView.remove();
    this._internalLayerGroupView = undefined;
  }
  this._leafletMap = undefined;
};

LayerGroup.prototype._createInternalLayerGroupView = function (map) {
  var leafletLayerGroupView = new LeafletCartoLayerGroupView(this._engine._cartoLayerGroup, map);

  leafletLayerGroupView.on('featureClick', this._onFeatureClick, this);
  leafletLayerGroupView.on('featureOver', this._onFeatureOver, this);
  leafletLayerGroupView.on('featureOut', this._onFeatureOut, this);

  return leafletLayerGroupView;
};

LayerGroup.prototype._onFeatureClick = function (internalEvent) {
  this._triggerLayerFeatureEvent(Layer.events.FEATURE_CLICKED, internalEvent);
};

LayerGroup.prototype._onFeatureOver = function (internalEvent) {
  this._leafletMap.getContainer().style.cursor = 'pointer';
  this._triggerLayerFeatureEvent(Layer.events.FEATURE_OVER, internalEvent);
};

LayerGroup.prototype._onFeatureOut = function (internalEvent) {
  this._leafletMap.getContainer().style.cursor = 'auto';
  this._triggerLayerFeatureEvent(Layer.events.FEATURE_OUT, internalEvent);
};

LayerGroup.prototype._triggerLayerFeatureEvent = function (eventName, internalEvent) {
  var layer = this._layers.findById(internalEvent.layer.id);
  if (layer) {
    var event = {
      data: undefined,
      latLng: undefined
    };
    if (internalEvent.feature) {
      event.data = internalEvent.feature;
    }
    if (internalEvent.latlng) {
      event.latLng = {
        lat: internalEvent.latlng[0],
        lng: internalEvent.latlng[1]
      };
    }

    /**
     * @event carto.layer.Layer.FeatureEvent
     * @property {LatLng} latLng - Object with coordinates where interaction took place
     * @property {object} data - Object with feature data (one attribute for each specified column)
     * 
     * @api
     */
    layer.trigger(eventName, event);
  }
};

module.exports = LayerGroup;
