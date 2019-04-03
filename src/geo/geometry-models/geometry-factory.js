var _ = require('underscore');
var Point = require('./point');
var Polyline = require('./polyline');
var Polygon = require('./polygon');
var MultiPoint = require('./multi-point');
var MultiPolygon = require('./multi-polygon');
var MultiPolyline = require('./multi-polyline');
var GeoJSONHelper = require('./geojson-helper');

var createPoint = function (attrs, options) {
  return new Point(attrs, options);
};

var createPolyline = function (attrs, options) {
  return new Polyline(attrs, options);
};

var createPolygon = function (attrs, options) {
  return new Polygon(attrs, options);
};

var createMultiPoint = function (attrs, options) {
  return new MultiPoint(attrs, options);
};

var createMultiPolygon = function (attrs, options) {
  return new MultiPolygon(attrs, options);
};

var createMultiPolyline = function (attrs, options) {
  return new MultiPolyline(attrs, options);
};

var createPointFromGeoJSON = function (geoJSON, options) {
  var latlng = GeoJSONHelper.getPointLatLngFromGeoJSONCoords(geoJSON);
  return createPoint(_.extend({}, options, { latlng: latlng }));
};

var createPolylineFromGeoJSON = function (geoJSON, options) {
  var latlngs = GeoJSONHelper.getPolylineLatLngsFromGeoJSONCoords(geoJSON);
  return createPolyline(options, { latlngs: latlngs });
};

var createPolygonFromGeoJSON = function (geoJSON, options) {
  var latlngs = GeoJSONHelper.getPolygonLatLngsFromGeoJSONCoords(geoJSON);
  return createPolygon(options, { latlngs: latlngs });
};

var createMultiPointFromGeoJSON = function (geoJSON, options) {
  var latlngs = GeoJSONHelper.getMultiPointLatLngsFromGeoJSONCoords(geoJSON);
  return createMultiPoint(options, { latlngs: latlngs });
};

var createMultiPolylineFromGeoJSON = function (geoJSON, options) {
  var latlngs = GeoJSONHelper.getMultiPolylineLatLngsFromGeoJSONCoords(geoJSON);
  return createMultiPolyline(options, { latlngs: latlngs });
};

var createMultiPolygonFromGeoJSON = function (geoJSON, options) {
  var latlngs = GeoJSONHelper.getMultiPolygonLatLngsFromGeoJSONCoords(geoJSON);
  return createMultiPolygon(options, { latlngs: latlngs });
};

var GEOJSON_TYPE_TO_CREATE_METHOD = {
  Point: createPointFromGeoJSON,
  LineString: createPolylineFromGeoJSON,
  Polygon: createPolygonFromGeoJSON,
  MultiPoint: createMultiPointFromGeoJSON,
  MultiPolygon: createMultiPolygonFromGeoJSON,
  MultiLineString: createMultiPolylineFromGeoJSON
};

var createGeometryFromGeoJSON = function (geoJSON, options) {
  var geometryType = GeoJSONHelper.getGeometryType(geoJSON);
  var createMethod = GEOJSON_TYPE_TO_CREATE_METHOD[geometryType];
  if (createMethod) {
    return createMethod(geoJSON, options);
  }

  throw new Error('Geometries of type ' + geometryType + ' are not supported yet');
};

module.exports = {
  createPoint: createPoint,
  createPolyline: createPolyline,
  createPolygon: createPolygon,
  createMultiPoint: createMultiPoint,
  createMultiPolyline: createMultiPolyline,
  createMultiPolygon: createMultiPolygon,
  createGeometryFromGeoJSON: createGeometryFromGeoJSON
};
