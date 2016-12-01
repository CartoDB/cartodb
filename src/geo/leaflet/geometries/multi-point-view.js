var MultiGeometryViewBase = require('../../geometry-views/base/multi-geometry-view-base');
var PointView = require('./point-view');

var MultiPointView = MultiGeometryViewBase.extend({
  GeometryViewClass: PointView
});

module.exports = MultiPointView;
