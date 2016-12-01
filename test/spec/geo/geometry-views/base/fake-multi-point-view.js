var MultiGeometryViewBase = require('../../../../../src/geo/geometry-views/base/multi-geometry-view-base');
var PointView = require('./fake-point-view');

var MultiPointView = MultiGeometryViewBase.extend({
  GeometryViewClass: PointView
});

module.exports = MultiPointView;
