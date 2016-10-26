var Polygon = require('./polygon');
var GeoJSONHelper = require('./geojson-helper');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPolygon = MultiGeometryBase.extend({
  defaults: {
    editable: false
  },

  _createGeometry: function (latlngs) {
    return new Polygon({
      editable: this.isEditable()
    }, {
      latlngs: latlngs
    });
  },

  toGeoJSON: function () {
    var coords = this.geometries.map(function (path) {
      return [ GeoJSONHelper.convertLatLngsToGeoJSONPolygonCoords(path.getLatLngs()) ];
    });
    return {
      'type': 'MultiPolygon',
      'coordinates': coords
    };
  }
});

module.exports = MultiPolygon;
