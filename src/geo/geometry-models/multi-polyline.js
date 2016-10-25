var Polyline = require('./polyline');
var MultiPathBase = require('./multi-path-base');

var MultiPolyline = MultiPathBase.extend({
  defaults: {
    type: 'multiPolyline',
    editable: false
  },

  PathClass: Polyline
});

module.exports = MultiPolyline;
