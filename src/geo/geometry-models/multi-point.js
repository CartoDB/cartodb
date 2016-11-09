var Point = require('./point');
var GeoJSONHelper = require('./geojson-helper');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPoint = MultiGeometryBase.extend({
  defaults: {
    editable: false
  },

  _createGeometry: function (latlng) {
    return new Point({
      latlng: latlng,
      editable: this.isEditable()
    });
  },

  toGeoJSON: function () {
    var coords = this.geometries.map(function (path) {
      return GeoJSONHelper.convertLatLngsToGeoJSONPointCoords(path.getCoordinates());
    });
    return {
      'type': 'MultiPoint',
      'coordinates': coords
    };
  },

  setCoordinatesFromGeoJSON: function (geoJSON) {
    var latlngs = this.getCoordinatesFromGeoJSONCoords(geoJSON);
    this.geometries.reset(this._createGeometries(latlngs));
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    return GeoJSONHelper.getMultiPointLatLngsFromGeoJSONCoords(geoJSON);
  }
});

module.exports = MultiPoint;
