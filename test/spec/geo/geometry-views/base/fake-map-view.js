var _ = require('underscore');
var MapViewBase = require('../../../../../src/geo/map-view.js');
var Marker = require('./fake-marker');
var Path = require('./fake-path');

var FakeMapView = MapViewBase.extend({
  initialize: function () {
    MapViewBase.prototype.initialize.apply(this, arguments);

    // Markers and paths
    this._markers = [];
    this._paths = [];
  },

  addMarker: function (marker) {
    this._markers.push(marker);
  },

  addPath: function (path) {
    this._paths.push(path);
  },

  removeMarker: function (marker) {
    var index = this._markers.indexOf(marker);
    if (index >= 0) {
      this._markers.splice(index, 1);
    }
  },

  removePath: function (path) {
    var index = this._paths.indexOf(path);
    if (index >= 0) {
      this._paths.splice(index, 1);
    }
  },

  hasMarker: function (marker) {
    return this._markers.indexOf(marker) >= 0;
  },

  getMarkers: function () {
    return this._markers;
  },

  getPaths: function () {
    return this._paths;
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
      return _.isEqual(marker.getCoordinates(), latlng);
    });
  }
});

module.exports = FakeMapView;
