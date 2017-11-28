/* global google */
var _ = require('underscore');
var Layer = require('../layer');
var GMapsCartoDBLayerGroupView = require('../../../geo/gmaps/gmaps-cartodb-layer-group-view');

/**
 * This object is a custom Google Maps MapType to enable feature interactivity
 * using an internal GMapsCartoDBLayerGroupView instance.
 *
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
  this._internalView.on('featureClick', this._onFeatureClick, this);
  this._internalView.on('featureOver', this._onFeatureOver, this);
  this._internalView.on('featureOut', this._onFeatureOut, this);
}

GoogleMapsMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
  return this._internalView.getTile(coord, zoom, ownerDocument);
};

GoogleMapsMapType.prototype._onFeatureClick = function (internalEvent) {
  this._triggerLayerFeatureEvent(Layer.events.FEATURE_CLICKED, internalEvent);
};

GoogleMapsMapType.prototype._onFeatureOver = function (internalEvent) {
  var layer = this._layers.findById(internalEvent.layer.id);
  if (layer.isInteractive()) {
    this._hoveredLayers[internalEvent.layerIndex] = true;
    this._map.setOptions({ draggableCursor: 'pointer' });
  }
  this._triggerLayerFeatureEvent(Layer.events.FEATURE_OVER, internalEvent);
};

GoogleMapsMapType.prototype._onFeatureOut = function (internalEvent) {
  this._hoveredLayers[internalEvent.layerIndex] = false;
  if (_.any(this._hoveredLayers)) {
    this._map.setOptions({ draggableCursor: 'pointer' });
  } else {
    this._map.setOptions({ draggableCursor: 'auto' });
  }
  this._triggerLayerFeatureEvent(Layer.events.FEATURE_OUT, internalEvent);
};

GoogleMapsMapType.prototype._triggerLayerFeatureEvent = function (eventName, internalEvent) {
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
    if (internalEvent.position) {
      event.position = internalEvent.position;
    }

    layer.trigger(eventName, event);
  }
};

module.exports = GoogleMapsMapType;
