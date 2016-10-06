var PathBase = require('./path-base');

var Polyline = PathBase.extend({
  defaults: {
    type: 'polyline',
    latlngs: []
  }
});

module.exports = Polyline;
