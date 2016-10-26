var Point = require('./point');
var MultiGeometryBase = require('./multi-geometry-base');

var MultiPoint = MultiGeometryBase.extend({
  defaults: {
    type: 'multiPoint',
    editable: false
  },

  _createGeometry: function (latlng) {
    return new Point({
      latlng: latlng,
      editable: this.isEditable()
    });
  }
});

module.exports = MultiPoint;
