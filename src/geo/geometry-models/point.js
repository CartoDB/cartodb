var GeometryBase = require('./geometry-base');

var Point = GeometryBase.extend({
  defaults: {
    type: 'point',
    draggable: true
  },

  update: function (latlng) {
    if (!this.get('latlng')) {
      this.set('latlng', latlng);
    }
  },

  isComplete: function () {
    return this.get('geojson') && this.get('latlng');
  }
});

module.exports = Point;
