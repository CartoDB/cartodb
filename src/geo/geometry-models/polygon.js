var GeoJSONHelper = require('./geojson-helper');
var PathBase = require('./path-base');

var Polygon = PathBase.extend({
  defaults: {
    editable: false,
    color: '#397dba'
  },

  isComplete: function () {
    return this.points.length >= 3;
  },

  toGeoJSON: function () {
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolygonCoords(this.getLatLngs());
    return {
      'type': 'Polygon',
      'coordinates': [ coords ]
    };
  },

  setCoordinatesFromGeoJSON: function (geoJSON) {
    var latlngs = GeoJSONHelper.getPolygonLatLngsFromGeoJSONCoords(geoJSON);
    this.setLatLngs(latlngs);
  }
});

module.exports = Polygon;
