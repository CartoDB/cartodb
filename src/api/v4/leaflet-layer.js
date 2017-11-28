var L = require('leaflet');
var _ = require('underscore');
var Layer = require('./layer');
var constants = require('./constants');
var LeafletCartoLayerGroupView = require('../../geo/leaflet/leaflet-cartodb-layer-group-view');
var CartoError = require('./error-handling/carto-error');

/**
 * This object is a custom Leaflet layer to enable feature interactivity
 * using an internal LeafletCartoLayerGroupView instance.
 *
 * There are some overwritten functions:
 * - getAttribution: returns always a custom OpenStreetMap / Carto attribution message
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
      this._internalView.on('featureError', this._onFeatureError, this);
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
    this._triggerLayerFeatureEvent(Layer.events.FEATURE_CLICKED, internalEvent);
  },

  _onFeatureOver: function (internalEvent) {
    var layer = this._layers.findById(internalEvent.layer.id);
    if (layer.isInteractive()) {
      this._hoveredLayers[internalEvent.layerIndex] = true;
      this._map.getContainer().style.cursor = 'pointer';
    }
    this._triggerLayerFeatureEvent(Layer.events.FEATURE_OVER, internalEvent);
  },

  _onFeatureOut: function (internalEvent) {
    this._hoveredLayers[internalEvent.layerIndex] = false;
    if (_.any(this._hoveredLayers)) {
      this._map.getContainer().style.cursor = 'pointer';
    } else {
      this._map.getContainer().style.cursor = 'auto';
    }
    this._triggerLayerFeatureEvent(Layer.events.FEATURE_OUT, internalEvent);
  },

  _onFeatureError: function (error) {
    var cartoError = new CartoError(error);
    this.fire(Layer.events.FEATURE_ERROR, cartoError);
  },

  _triggerLayerFeatureEvent: function (eventName, internalEvent) {
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
       *
       * Events triggered by {@link carto.layer.Layer} when users interact with a feature.
       *
       * @event carto.layer.Layer.FeatureEvent
       * @property {LatLng} latLng - Object with coordinates where interaction took place
       * @property {object} data - Object with feature data (one attribute for each specified column)
       *
       * @api
       */
      layer.trigger(eventName, event);
    }
  }
});

module.exports = LeafletLayer;
