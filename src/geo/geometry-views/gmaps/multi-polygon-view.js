var MultiGeometryViewBase = require('../base/multi-geometry-view-base');
var PolygonView = require('./polygon-view');

var MultiPolygonView = MultiGeometryViewBase.extend({
  GeometryViewClass: PolygonView
});

module.exports = MultiPolygonView;
