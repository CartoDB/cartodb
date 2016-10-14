var GeometryBase = require('./geometry-base');

var Point = GeometryBase.extend({
  defaults: {
    type: 'point',
    editable: false,
    iconUrl: '/themes/img/default-marker-icon.png',
    iconAnchor: [ 11, 11 ]
  },

  update: function (latlng) {
    if (!this.get('latlng')) {
      this.set('latlng', latlng);
    }
  },

  isComplete: function () {
    return this.get('geojson') && this.get('latlng');
  },

  isEditable: function () {
    return !!this.get('editable');
  }
});

module.exports = Point;
