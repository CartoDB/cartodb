var Polygon = require('./polygon');
var GeoJSONHelper = require('./geojson-helper');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPolygon = MultiGeometryBase.extend({
  defaults: {
    editable: false,
    expandable: false
  },

  _createGeometry: function (latlngs) {
    return new Polygon({
      editable: this.isEditable(),
      expandable: this.isExpandable()
    }, {
      latlngs: latlngs
    });
  },

  toGeoJSON: function () {
    var coords = this.geometries.map(function (path) {
      return [ GeoJSONHelper.convertLatLngsToGeoJSONPolygonCoords(path.getCoordinates()) ];
    });
    return {
      'type': 'MultiPolygon',
      'coordinates': coords
    };
  },

  setCoordinatesFromGeoJSON: function (geoJSON) {
    var latlngs = this.getCoordinatesFromGeoJSONCoords(geoJSON);
    this.geometries.reset(this._createGeometries(latlngs));
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    return GeoJSONHelper.getMultiPolygonLatLngsFromGeoJSONCoords(geoJSON);
  }
});

module.exports = MultiPolygon;
