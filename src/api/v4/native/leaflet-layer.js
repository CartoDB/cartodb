var L = require('leaflet');
var _ = require('underscore');
var Layer = require('../layer');
var constants = require('../constants');
var triggerLayerFeatureEvent = require('./trigger-layer-feature-event');
var LeafletCartoLayerGroupView = require('../../../geo/leaflet/leaflet-cartodb-layer-group-view');

/**
 * This object is a custom Leaflet layer to enable feature interactivity
 * using an internal LeafletCartoLayerGroupView instance.
 *
 * There are two overwritten functions:
 * - addTo: when the layer is added to a map it also creates a LeafletCartoLayerGroupView
 *          object called `_internalView` in order to enable the feature events
 * - removeFrom: when the layer is removed from a map it also removes the feature events
 *               listeners, triggers a 'remove' event and removes the `_internalView`
 *
 * NOTE: It also contains the feature events handlers. That's why it requires the carto layers array.
 */

var LeafletLayer = L.TileLayer.extend({
  options: {
    opacity: 0.99,
    maxZoom: 30,
    attribution: constants.ATTRIBUTION
  },

  initialize: function (layers, engine) {
    this._layers = layers;
    this._engine = engine;
    this._internalView = null;

    this._hoveredLayers = [];
  },

  addTo: function (map) {
    if (!this._internalView) {
      this._internalView = new LeafletCartoLayerGroupView(this._engine._cartoLayerGroup, {
        nativeMap: map,
        nativeLayer: this
      });
      this._internalView.on('featureClick', this._onFeatureClick, this);
      this._internalView.on('featureOver', this._onFeatureOver, this);
      this._internalView.on('featureOut', this._onFeatureOut, this);
    }

    return L.TileLayer.prototype.addTo.call(this, map);
  },

  removeFrom: function (map) {
    if (this._internalView) {
      this._internalView.off('featureClick');
      this._internalView.off('featureOver');
      this._internalView.off('featureOut');
      this._internalView.notifyRemove();
    }
    this._internalView = null;

    return L.TileLayer.prototype.removeFrom.call(this, map);
  },

  setUrl: undefined,

  _setUrl: function (url, noDraw) {
    return L.TileLayer.prototype.setUrl.call(this, url, noDraw);
  },

  _onFeatureClick: function (internalEvent) {
    triggerLayerFeatureEvent(Layer.events.FEATURE_CLICKED, internalEvent, this._layers);
  },

  _onFeatureOver: function (internalEvent) {
    var layer = this._layers.findById(internalEvent.layer.id);
    if (layer.isInteractive()) {
      this._hoveredLayers[internalEvent.layerIndex] = true;
      this._map.getContainer().style.cursor = 'pointer';
    }
    triggerLayerFeatureEvent(Layer.events.FEATURE_OVER, internalEvent, this._layers);
  },

  _onFeatureOut: function (internalEvent) {
    this._hoveredLayers[internalEvent.layerIndex] = false;
    if (_.any(this._hoveredLayers)) {
      this._map.getContainer().style.cursor = 'pointer';
    } else {
      this._map.getContainer().style.cursor = 'auto';
    }
    triggerLayerFeatureEvent(Layer.events.FEATURE_OUT, internalEvent, this._layers);
  }
});

module.exports = LeafletLayer;
