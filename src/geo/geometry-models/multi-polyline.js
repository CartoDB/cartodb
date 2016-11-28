var Polyline = require('./polyline');
var GeoJSONHelper = require('./geojson-helper');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPolyline = MultiGeometryBase.extend({
  defaults: {
    editable: false,
    expandable: false
  },

  _createGeometry: function (latlngs) {
    return new Polyline({
      editable: this.isEditable(),
      expandable: this.isExpandable()
    }, {
      latlngs: latlngs
    });
  },

  toGeoJSON: function () {
    var coords = this.geometries.map(function (path) {
      return GeoJSONHelper.convertLatLngsToGeoJSONPolylineCoords(path.getCoordinates());
    });
    return {
      'type': 'MultiLineString',
      'coordinates': coords
    };
  },

  setCoordinatesFromGeoJSON: function (geoJSON) {
    var latlngs = this.getCoordinatesFromGeoJSONCoords(geoJSON);
    this.geometries.reset(this._createGeometries(latlngs));
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    return GeoJSONHelper.getMultiPolylineLatLngsFromGeoJSONCoords(geoJSON);
  }
});

module.exports = MultiPolyline;
