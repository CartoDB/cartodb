var MultiGeometryViewBase = require('./multi-geometry-view-base');
var PolygonView = require('./polygon-view');

var MultiPolygonView = MultiGeometryViewBase.extend({
  PathViewClass: PolygonView,
  geoJSONType: 'MultiPolygon'
});

module.exports = MultiPolygonView;
