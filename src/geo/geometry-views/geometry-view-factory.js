var Map = require('../map.js');

var Point = require('../geometry-models/point');
var Polyline = require('../geometry-models/polyline');
var Polygon = require('../geometry-models/polygon');
var MultiPoint = require('../geometry-models/multi-point');
var MultiPolygon = require('../geometry-models/multi-polygon');
var MultiPolyline = require('../geometry-models/multi-polyline');

var getGeometryViewForGeometry = function (provider, geometry) {
  var GeometryView;
  if (provider === Map.PROVIDERS.GMAPS) {
    GeometryView = getGoogleMapsGeometryViewForGeometry(geometry);
  } else if (provider === Map.PROVIDERS.LEAFLET) {
    GeometryView = getLeafletGeometryViewForGeometry(geometry);
  } else {
    throw new Error("unknown provider: '" + provider);
  }
  return GeometryView;
};

/* Leaflet */

var LeafletPointView = require('../leaflet/geometries/point-view');
var LeafletPolygonView = require('../leaflet/geometries/polygon-view');
var LeafletPolylineView = require('../leaflet/geometries/polyline-view');
var LeafletMultiPointView = require('../leaflet/geometries/multi-point-view');
var LeafletMultiPolygonView = require('../leaflet/geometries/multi-polygon-view');
var LeafletMultiPolylineView = require('../leaflet/geometries/multi-polyline-view');

var getLeafletGeometryViewForGeometry = function (geometry) {
  var GeometryView;
  if (geometry instanceof Point) {
    GeometryView = LeafletPointView;
  } else if (geometry instanceof Polyline) {
    GeometryView = LeafletPolylineView;
  } else if (geometry instanceof Polygon) {
    GeometryView = LeafletPolygonView;
  } else if (geometry instanceof MultiPoint) {
    GeometryView = LeafletMultiPointView;
  } else if (geometry instanceof MultiPolyline) {
    GeometryView = LeafletMultiPolylineView;
  } else if (geometry instanceof MultiPolygon) {
    GeometryView = LeafletMultiPolygonView;
  }
  return GeometryView;
};

/* Google Maps */

var GoogleMapsPointView = require('../gmaps/geometries/point-view');
var GoogleMapsPolygonView = require('../gmaps/geometries/polygon-view');
var GoogleMapsPolylineView = require('../gmaps/geometries/polyline-view');
var GoogleMapsMultiPointView = require('../gmaps/geometries/multi-point-view');
var GoogleMapsMultiPolygonView = require('../gmaps/geometries/multi-polygon-view');
var GoogleMapsMultiPolylineView = require('../gmaps/geometries/multi-polyline-view');

var getGoogleMapsGeometryViewForGeometry = function (geometry) {
  var GeometryView;
  if (geometry instanceof Point) {
    GeometryView = GoogleMapsPointView;
  } else if (geometry instanceof Polyline) {
    GeometryView = GoogleMapsPolylineView;
  } else if (geometry instanceof Polygon) {
    GeometryView = GoogleMapsPolygonView;
  } else if (geometry instanceof MultiPoint) {
    GeometryView = GoogleMapsMultiPointView;
  } else if (geometry instanceof MultiPolyline) {
    GeometryView = GoogleMapsMultiPolylineView;
  } else if (geometry instanceof MultiPolygon) {
    GeometryView = GoogleMapsMultiPolygonView;
  }
  return GeometryView;
};

var GeometryViewFactory = {
  createGeometryView: function (provider, geometry, mapView) {
    var GeometryView = getGeometryViewForGeometry(provider, geometry);
    if (GeometryView) {
      return new GeometryView({
        model: geometry,
        mapView: mapView
      });
    }

    throw new Error(geometry.get('type') + ' is not supported yet');
  }
};

module.exports = GeometryViewFactory;
