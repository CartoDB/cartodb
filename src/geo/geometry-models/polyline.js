var PathBase = require('./path-base');

var Polyline = PathBase.extend({
  defaults: {
    type: 'polyline',
    color: '#397dba',
    latlngs: []
  },

  isComplete: function () {
    return this.get('geojson') && this.points.length > 1;
  }
});

module.exports = Polyline;
