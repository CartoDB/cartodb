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

var createPointFromGeoJSON = function (geoJSON) {
  var latlng = GeoJSONHelper.getPointLatLngFromGeoJSONCoords(geoJSON);
  return createPoint({
    latlng: latlng,
    editable: true
  });
};

var createPolylineFromGeoJSON = function (geoJSON) {
  var latlngs = GeoJSONHelper.getPolylineLatLngsFromGeoJSONCoords(geoJSON);
  return createPolyline({
    editable: true
  }, { latlngs: latlngs });
};

var createPolygonFromGeoJSON = function (geoJSON) {
  var latlngs = GeoJSONHelper.getPolygonLatLngsFromGeoJSONCoords(geoJSON);
  return createPolygon({
    editable: true
  }, { latlngs: latlngs });
};

var createMultiPointFromGeoJSON = function (geoJSON) {
  var latlngs = GeoJSONHelper.getMultiPointLatLngsFromGeoJSONCoords(geoJSON);
  return createMultiPoint({
    editable: true
  }, {
    latlngs: latlngs
  });
};

var createMultiPolylineFromGeoJSON = function (geoJSON) {
  var latlngs = GeoJSONHelper.getMultiPolylineLatLngsFromGeoJSONCoords(geoJSON);
  return createMultiPolyline({
    editable: true
  }, {
    latlngs: latlngs
  });
};

var createMultiPolygonFromGeoJSON = function (geoJSON) {
  var latlngs = GeoJSONHelper.getMultiPolygonLatLngsFromGeoJSONCoords(geoJSON);
  return createMultiPolygon({
    editable: true
  }, {
    latlngs: latlngs
  });
};

var GEOJSON_TYPE_TO_CREATE_METHOD = {
  Point: createPointFromGeoJSON,
  LineString: createPolylineFromGeoJSON,
  Polygon: createPolygonFromGeoJSON,
  MultiPoint: createMultiPointFromGeoJSON,
  MultiPolygon: createMultiPolygonFromGeoJSON,
  MultiLineString: createMultiPolylineFromGeoJSON
};

var createGeometryFromGeoJSON = function (geoJSON) {
  var geometryType = GeoJSONHelper.getGeometryType(geoJSON);
  var createMethod = GEOJSON_TYPE_TO_CREATE_METHOD[geometryType];
  if (createMethod) {
    return createMethod(geoJSON);
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
