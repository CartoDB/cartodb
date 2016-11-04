var GeoJSONHelper = require('./geojson-helper');
var PathBase = require('./path-base');

var Polyline = PathBase.extend({
  defaults: {
    editable: false,
    color: '#397dba'
  },

  isComplete: function () {
    return this.points.length >= 2;
  },

  toGeoJSON: function () {
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolylineCoords(this.getCoordinates());
    return {
      'type': 'LineString',
      'coordinates': coords
    };
  },

  setCoordinatesFromGeoJSON: function (geoJSON) {
    var latlngs = GeoJSONHelper.getPolylineLatLngsFromGeoJSONCoords(geoJSON);
    this.setCoordinates(latlngs);
  }
});

module.exports = Polyline;
