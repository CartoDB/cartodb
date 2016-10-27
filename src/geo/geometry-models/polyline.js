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
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolylineCoords(this.getLatLngs());
    return {
      'type': 'LineString',
      'coordinates': coords
    };
  }
});

module.exports = Polyline;
