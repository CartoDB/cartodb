var _ = require('underscore');
var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var CoordinatesComparator = require('../coordinates-comparator');

module.exports = LeafletMapView.extend({
  initialize: function () {
    LeafletMapView.prototype.initialize.apply(this, arguments);

    this._markers = [];
    this._paths = [];
  },

  addMarker: function (marker) {
    LeafletMapView.prototype.addMarker.apply(this, arguments);
    this._markers.push(marker);
  },

  removeMarker: function (marker) {
    LeafletMapView.prototype.removeMarker.apply(this, arguments);
    var index = this._markers.indexOf(marker);
    if (index >= 0) {
      this._markers.splice(index, 1);
    }
  },

  addPath: function (path) {
    LeafletMapView.prototype.addPath.apply(this, arguments);
    this._paths.push(path);
  },

  removePath: function (path) {
    LeafletMapView.prototype.removePath.apply(this, arguments);
    var index = this._paths.indexOf(path);
    if (index >= 0) {
      this._paths.splice(index, 1);
    }
  },

  getMarkers: function () {
    return this._markers;
  },

  getPaths: function () {
    return this._paths;
  },

  findMarkerByLatLng: function (latlng) {
    var markers = this.getMarkers();
    return _.find(markers, function (marker) {
      return CoordinatesComparator.areCoordinatesSimilar([marker.getCoordinates()], [latlng]);
    }, this);
  }
});
