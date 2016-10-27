var Point = require('../../geometry-models/point');
var Polyline = require('../../geometry-models/polyline');
var Polygon = require('../../geometry-models/polygon');
var MultiPoint = require('../../geometry-models/multi-point');
var MultiPolygon = require('../../geometry-models/multi-polygon');
var MultiPolyline = require('../../geometry-models/multi-polyline');

var PointView = require('./point-view');
var PolygonView = require('./polygon-view');
var PolylineView = require('./polyline-view');
var MultiPointView = require('./multi-point-view');
var MultiPolygonView = require('./multi-polygon-view');
var MultiPolylineView = require('./multi-polyline-view');

var getGeometryViewForGeometry = function (geometry) {
  var GeometryView;
  if (geometry instanceof Point) {
    GeometryView = PointView;
  } else if (geometry instanceof Polyline) {
    GeometryView = PolylineView;
  } else if (geometry instanceof Polygon) {
    GeometryView = PolygonView;
  } else if (geometry instanceof MultiPoint) {
    GeometryView = MultiPointView;
  } else if (geometry instanceof MultiPolyline) {
    GeometryView = MultiPolylineView;
  } else if (geometry instanceof MultiPolygon) {
    GeometryView = MultiPolygonView;
  }
  return GeometryView;
};

var GeometryViewFactory = {
  createGeometryView: function (geometry, mapView) {
    var GeometryView = getGeometryViewForGeometry(geometry);
    if (GeometryView) {
      return new GeometryView({
        model: geometry,
        nativeMap: mapView.getNativeMap()
      });
    }

    throw new Error(geometry.get('type') + ' is not supported yet');
  }
};

module.exports = GeometryViewFactory;
