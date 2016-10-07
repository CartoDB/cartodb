var PathBase = require('./path-base');

var Polygon = PathBase.extend({
  defaults: {
    type: 'polygon',
    color: '#397dba'
  },

  isComplete: function () {
    return this.get('geojson') && this.points.length > 2;
  }
});

module.exports = Polygon;
