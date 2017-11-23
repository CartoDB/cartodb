var L = require('leaflet');
var Layer = require('./layer');
var LeafletCartoLayerGroupView = require('../../geo/leaflet/leaflet-cartodb-layer-group-view');

var LeafletLayer = L.TileLayer.extend({
  options: {
    opacity: 0.99,
    maxZoom: 30
  },

  initialize: function (layers, engine) {
    this._layers = layers;
    this._engine = engine;
    this._internalView = null;
  },

  getAttribution: function () {
    return '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>';
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
      // this._internalView.remove();
    }
    this._internalView = null;

    return L.TileLayer.prototype.removeFrom.call(this, map);
  },

  _onFeatureClick: function (internalEvent) {
    this._triggerLayerFeatureEvent(Layer.events.FEATURE_CLICKED, internalEvent);
  },

  _onFeatureOver: function (internalEvent) {
    var layer = this._layers.findById(internalEvent.layer.id);
    if (layer && (layer.hasFeatureClickColumns() || layer.hasFeatureOverColumns())) {
      this._map.getContainer().style.cursor = 'pointer';
    }
    this._triggerLayerFeatureEvent(Layer.events.FEATURE_OVER, internalEvent);
  },

  _onFeatureOut: function (internalEvent) {
    this._map.getContainer().style.cursor = 'auto';
    this._triggerLayerFeatureEvent(Layer.events.FEATURE_OUT, internalEvent);
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
