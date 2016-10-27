var Polyline = require('./polyline');
var GeoJSONHelper = require('./geojson-helper');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPolyline = MultiGeometryBase.extend({
  defaults: {
    editable: false
  },

  _createGeometry: function (latlngs) {
    return new Polyline({
      editable: this.isEditable()
    }, {
      latlngs: latlngs
    });
  },

  toGeoJSON: function () {
    var coords = this.geometries.map(function (path) {
      return [ GeoJSONHelper.convertLatLngsToGeoJSONPolylineCoords(path.getLatLngs()) ];
    });
    return {
      'type': 'MultiLineString',
      'coordinates': coords
    };
  }
});

module.exports = MultiPolyline;
