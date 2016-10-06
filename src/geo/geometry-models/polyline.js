var PathBase = require('./path-base');

var Polyline = PathBase.extend({
  defaults: {
    type: 'polyline',
    color: '#397dba',
    latlngs: []
  }
});

module.exports = Polyline;
