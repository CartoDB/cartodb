var _ = require('underscore');
var L = require('leaflet');

module.exports = function () {
  var map = {
    _layers: [],

    on: function () {},

    off: function () {},

    addLayer: function (layer) {
      this._layers.push(layer);
    },

    removeLayer: function (layer) {
      var index = this._layers.indexOf(layer);
      if (index >= 0) {
        this._layers.splice(index, 1);
      }
    },

    hasLayer: function (layer) {
      return this._layers.indexOf(layer) >= 0;
    },

    getLayers: function () {
      return this._layers;
    },

    getMarkers: function () {
      return this._getLayersByType(L.Marker);
    },

    getPaths: function () {
      return this._getLayersByType(L.Path);
    },

    _getLayersByType: function (LayerClass) {
      return _.select(this.getLayers(), function (layer) {
        return layer instanceof LayerClass;
      });
    },

    latLngToContainerPoint: function (latlng) {
      return {
        x: latlng[0],
        y: latlng[1]
      };
    },

    containerPointToLatLng: function (point) {
      return {
        lat: point[0],
        lng: point[1]
      };
    },

    findMarkerByLatLng: function (latlng) {
      var markers = this.getMarkers();
      return _.find(markers, function (marker) {
        return _.isEqual(marker.getLatLng(), latlng);
      });
    }
  };

  return map;
};
