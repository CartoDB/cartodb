var MultiPathViewBase = require('./multi-path-view-base');
var PolylineView = require('./polyline-view');

var MultiPolygonView = MultiPathViewBase.extend({
  PathViewClass: PolylineView,
  geoJSONType: 'MultiLineString'
});

module.exports = MultiPolygonView;
