var PointView = require('./point-view');
var PolygonView = require('./polygon-view');
var PolylineView = require('./polyline-view');
var MultiPolygonView = require('./multi-polygon-view');
var MultiPolylineView = require('./multi-polyline-view');

var GEOMETRY_VIEWS = {
  'point': PointView,
  'polyline': PolylineView,
  'polygon': PolygonView,
  'multiPolygon': MultiPolygonView,
  'multiPolyline': MultiPolylineView
};

var GeometryViewFactory = {
  createGeometryView: function (geometry, mapView) {
    var GeometryView = GEOMETRY_VIEWS[geometry.get('type')];
    if (GeometryView) {
      return new GeometryView({
        model: geometry,
        nativeMap: mapView.getNativeMap()
      });
    } else {
      throw new Error(geometry.get('type') + ' is not supported yet');
    }
  }
};

module.exports = GeometryViewFactory;
