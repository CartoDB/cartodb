var Polygon = require('./polygon');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPolygon = MultiGeometryBase.extend({
  defaults: {
    type: 'multiPolygon',
    editable: false
  },

  _createGeometry: function (latlngs) {
    return new Polygon({
      editable: this.isEditable()
    }, {
      latlngs: latlngs
    });
  }
});

module.exports = MultiPolygon;
