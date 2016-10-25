var Polygon = require('./polygon');
var MultiPathBase = require('./multi-path-base');

var MultiPolygon = MultiPathBase.extend({
  defaults: {
    type: 'multiPolygon',
    editable: false
  },

  PathClass: Polygon
});

module.exports = MultiPolygon;
