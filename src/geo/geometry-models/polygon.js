var GeoJSONHelper = require('./geojson-helper');
var PathBase = require('./path-base');

var Polygon = PathBase.extend({
  defaults: {
    editable: false,
    expandable: false,
    color: '#397dba'
  },

  MIN_NUMBER_OF_VERTICES: 3,

  isComplete: function () {
    return this.points.length >= this.MIN_NUMBER_OF_VERTICES;
  },

  toGeoJSON: function () {
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolygonCoords(this.getCoordinates());
    return {
      'type': 'Polygon',
      'coordinates': [ coords ]
    };
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    return GeoJSONHelper.getPolygonLatLngsFromGeoJSONCoords(geoJSON);
  }
});

module.exports = Polygon;
