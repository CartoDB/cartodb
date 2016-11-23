var GeoJSONHelper = require('./geojson-helper');
var PathBase = require('./path-base');

var Polyline = PathBase.extend({
  defaults: {
    editable: false,
    expandable: false,
    color: '#397dba'
  },

  MIN_NUMBER_OF_VERTICES: 2,

  isComplete: function () {
    return this.points.length >= this.MIN_NUMBER_OF_VERTICES;
  },

  toGeoJSON: function () {
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolylineCoords(this.getCoordinates());
    return {
      'type': 'LineString',
      'coordinates': coords
    };
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    return GeoJSONHelper.getPolylineLatLngsFromGeoJSONCoords(geoJSON);
  }
});

module.exports = Polyline;
