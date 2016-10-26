var MultiGeometryViewBase = require('./multi-geometry-view-base');
var PointView = require('./point-view');

var MultiPointView = MultiGeometryViewBase.extend({
  PathViewClass: PointView,
  geoJSONType: 'MultiPoint'
});

module.exports = MultiPointView;
