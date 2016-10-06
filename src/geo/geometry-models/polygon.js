var PathBase = require('./path-base');

var Polygon = PathBase.extend({
  defaults: {
    type: 'polygon',
    color: '#397dba',
    latlngs: []
  }
});

module.exports = Polygon;
