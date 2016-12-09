var MultiGeometryViewBase = require('../../geometry-views/base/multi-geometry-view-base');
var Pointview = require('./point-view');

var MultiPolygonView = MultiGeometryViewBase.extend({
  GeometryViewClass: Pointview
});

module.exports = MultiPolygonView;
