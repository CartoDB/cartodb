var MultiGeometryViewBase = require('../../../../../src/geo/geometry-views/base/multi-geometry-view-base');
var PathView = require('./fake-path-view');

var MultiPointView = MultiGeometryViewBase.extend({
  GeometryViewClass: PathView
});

module.exports = MultiPointView;
