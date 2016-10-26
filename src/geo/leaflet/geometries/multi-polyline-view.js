var MultiGeometryViewBase = require('./multi-geometry-view-base');
var PolylineView = require('./polyline-view');

var MultiPolygonView = MultiGeometryViewBase.extend({
  PathViewClass: PolylineView,
  geoJSONType: 'MultiLineString'
});

module.exports = MultiPolygonView;
