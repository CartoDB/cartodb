var Polyline = require('./polyline');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPolyline = MultiGeometryBase.extend({
  defaults: {
    type: 'multiPolyline',
    editable: false
  },

  _createGeometry: function (latlngs) {
    return new Polyline({
      editable: this.isEditable()
    }, {
      latlngs: latlngs
    });
  }
});

module.exports = MultiPolyline;
