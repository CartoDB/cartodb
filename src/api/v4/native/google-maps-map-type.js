/* global google */
var _ = require('underscore');
var Layer = require('../layer');
var triggerLayerFeatureEvent = require('./trigger-layer-feature-event');
var GMapsCartoDBLayerGroupView = require('../../../geo/gmaps/gmaps-cartodb-layer-group-view');
var CartoError = require('../error-handling/carto-error');

/**
 * This object is a custom Google Maps MapType to enable feature interactivity
 * using an internal GMapsCartoDBLayerGroupView instance.
 *
 * NOTE: It also contains the feature events handlers. That's why it requires the carto layers array.
 */
function GoogleMapsMapType (layers, engine, map) {
  this._layers = layers;
  this._engine = engine;
  this._map = map;

  this._hoveredLayers = [];

  this.tileSize = new google.maps.Size(256, 256);
  this._internalView = new GMapsCartoDBLayerGroupView(this._engine._cartoLayerGroup, {
    nativeMap: map
  });
  this._id = this._internalView._id;
  this._internalView.on('featureClick', this._onFeatureClick, this);
  this._internalView.on('featureOver', this._onFeatureOver, this);
  this._internalView.on('featureOut', this._onFeatureOut, this);
  this._internalView.on('featureError', this._onFeatureError, this);
}

GoogleMapsMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
  return this._internalView.getTile(coord, zoom, ownerDocument);
};

GoogleMapsMapType.prototype._onFeatureClick = function (internalEvent) {
  var layer = this._layers.findById(internalEvent.layer.id);
  triggerLayerFeatureEvent(Layer.events.FEATURE_CLICKED, internalEvent, layer);
};

GoogleMapsMapType.prototype._onFeatureOver = function (internalEvent) {
  var layer = this._layers.findById(internalEvent.layer.id);
  if (layer.isInteractive()) {
    this._hoveredLayers[internalEvent.layerIndex] = true;
    this._map.setOptions({ draggableCursor: 'pointer' });
  }
  triggerLayerFeatureEvent(Layer.events.FEATURE_OVER, internalEvent, layer);
};

GoogleMapsMapType.prototype._onFeatureOut = function (internalEvent) {
  var layer = this._layers.findById(internalEvent.layer.id);
  this._hoveredLayers[internalEvent.layerIndex] = false;
  if (_.any(this._hoveredLayers)) {
    this._map.setOptions({ draggableCursor: 'pointer' });
  } else {
    this._map.setOptions({ draggableCursor: 'auto' });
  }
  triggerLayerFeatureEvent(Layer.events.FEATURE_OUT, internalEvent, layer);
};

GoogleMapsMapType.prototype._onFeatureError = function (error) {
  var cartoError = new CartoError(error);
  _.each(this._layers.toArray(), function (layer) {
    if (layer.isInteractive()) {
      layer.trigger(Layer.events.TILE_ERROR, cartoError);
    }
  });
};

module.exports = GoogleMapsMapType;
