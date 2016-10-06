var PathBase = require('./path-base');

var Polygon = PathBase.extend({
  defaults: {
    type: 'polygon',
    latlngs: []
  }
});

module.exports = Polygon;
