var MultiGeometryViewBase = require('../base/multi-geometry-view-base');
var PolylineView = require('./polyline-view');

var MultiPolygonView = MultiGeometryViewBase.extend({
  GeometryViewClass: PolylineView
});

module.exports = MultiPolygonView;
