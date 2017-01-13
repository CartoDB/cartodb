var _ = require('underscore');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var CoordinatesComparator = require('./coordinates-comparator');

module.exports = function (MapViewBase) {
  if (!MapViewBase) throw new Error('MapViewBase is required');

  // We extend the specific MapView and add some methods to make
  // testing easier
  var MapView = MapViewBase.extend({
    initialize: function () {
      MapViewBase.prototype.initialize.apply(this, arguments);

      this._markers = [];
      this._paths = [];
    },

    addMarker: function (marker) {
      MapViewBase.prototype.addMarker.apply(this, arguments);
      this._markers.push(marker);
    },

    removeMarker: function (marker) {
      MapViewBase.prototype.removeMarker.apply(this, arguments);
      var index = this._markers.indexOf(marker);
      if (index >= 0) {
        this._markers.splice(index, 1);
      }
    },

    addPath: function (path) {
      MapViewBase.prototype.addPath.apply(this, arguments);
      this._paths.push(path);
    },

    removePath: function (path) {
      MapViewBase.prototype.removePath.apply(this, arguments);
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

  var map = new Map(null, {
    layersFactory: {}
  });
  return new MapView({
    mapModel: map,
    visModel: new Backbone.Model(),
    layerGroupModel: {}
  });
};
