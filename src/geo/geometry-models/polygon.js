var GeoJSONHelper = require('./geojson-helper');
var PathBase = require('./path-base');

var Polygon = PathBase.extend({
  defaults: {
    type: 'polygon',
    color: '#397dba'
  },

  isComplete: function () {
    return this.points.length > 2;
  },

  toGeoJSON: function () {
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolygonCoords(this.getLatLngs());
    return {
      'type': 'Polygon',
      'coordinates': [ coords ]
    };
  }
});

module.exports = Polygon;
