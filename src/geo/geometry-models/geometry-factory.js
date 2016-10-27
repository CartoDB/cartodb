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

var createPointFromGeoJSON = function (geoJSON) {
  var lnglat = GeoJSONHelper.getGeometryCoordinates(geoJSON);
  var latlng = GeoJSONHelper.convertLngLatToLatLng(lnglat);
  return createPoint({
    latlng: latlng,
    geojson: geoJSON,
    editable: true
  });
};

var createPolylineFromGeoJSON = function (geoJSON) {
  var lnglats = GeoJSONHelper.getGeometryCoordinates(geoJSON);
  var latlngs = GeoJSONHelper.convertLngLatsToLatLngs(lnglats);
  return createPolyline({
    geojson: geoJSON,
    editable: true
  }, { latlngs: latlngs });
};

var createPolygonFromGeoJSON = function (geoJSON) {
  var lnglats = GeoJSONHelper.getGeometryCoordinates(geoJSON)[0];
  var latlngs = GeoJSONHelper.convertLngLatsToLatLngs(lnglats);
  // Remove the last latlng, which is duplicated
  latlngs = latlngs.slice(0, -1);
  return createPolygon({
    geojson: geoJSON,
    editable: true
  }, { latlngs: latlngs });
};

var createMultiPointFromGeoJSON = function (geoJSON) {
  var lnglats = GeoJSONHelper.getGeometryCoordinates(geoJSON);
  var latlngs = GeoJSONHelper.convertLngLatsToLatLngs(lnglats);
  return createMultiPoint({
    geojson: geoJSON,
    editable: true
  }, {
    latlngs: latlngs
  });
};

var createMultiPolygonFromGeoJSON = function (geoJSON) {
  var lnglats = GeoJSONHelper.getGeometryCoordinates(geoJSON);
  var latlngs = _.map(lnglats, function (lnglats) {
    // Remove the last latlng, which is duplicated
    latlngs = GeoJSONHelper.convertLngLatsToLatLngs(lnglats[0]);
    latlngs = latlngs.slice(0, -1);
    return latlngs;
  }, this);
  return createMultiPolygon({
    geojson: geoJSON,
    editable: true
  }, {
    latlngs: latlngs
  });
};

var createMultiPolylineFromGeoJSON = function (geoJSON) {
  var lnglats = GeoJSONHelper.getGeometryCoordinates(geoJSON);
  var latlngs = _.map(lnglats, function (lnglats) {
    return GeoJSONHelper.convertLngLatsToLatLngs(lnglats);
  }, this);
  return createMultiPolyline({
    geojson: geoJSON,
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
