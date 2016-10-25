var _ = require('underscore');
var Point = require('./point');
var Polyline = require('./polyline');
var Polygon = require('./polygon');
var MultiPolygon = require('./multi-polygon');
var MultiPolyline = require('./multi-polyline');

var GEOJSON_TYPE_TO_CREATE_METHOD_NAME = {
  Point: 'createPointFromGeoJSON',
  LineString: 'createPolylineFromGeoJSON',
  Polygon: 'createPolygonFromGeoJSON',
  MultiPolygon: 'createMultiPolygonFromGeoJSON',
  MultiLineString: 'createMultiPolylineFromGeoJSON'
};

var getGeometryType = function (geoJSON) {
  return (geoJSON.geometry && geoJSON.geometry.type) ||
    geoJSON.type;
};

var getGeometryCoordinates = function (geoJSON) {
  return (geoJSON.geometry && geoJSON.geometry.coordinates) ||
    geoJSON.coordinates;
};

var convertLngLatsToLatLngs = function (lnglats) {
  return _.map(lnglats, function (lnglat) {
    return [ lnglat[1], lnglat[0] ];
  });
};

var GeometryFactory = function () {};

GeometryFactory.prototype.createPoint = function (attrs, options) {
  return new Point(attrs, options);
};

GeometryFactory.prototype.createPolyline = function (attrs, options) {
  return new Polyline(attrs, options);
};

GeometryFactory.prototype.createPolygon = function (attrs, options) {
  return new Polygon(attrs, options);
};

GeometryFactory.prototype.createMultiPolygon = function (attrs, options) {
  return new MultiPolygon(attrs, options);
};

GeometryFactory.prototype.createMultiPolyline = function (attrs, options) {
  return new MultiPolyline(attrs, options);
};

GeometryFactory.prototype.createGeometryFromGeoJSON = function (geoJSON) {
  var geometryType = getGeometryType(geoJSON);
  var methodName = GEOJSON_TYPE_TO_CREATE_METHOD_NAME[geometryType];
  if (methodName) {
    return this[methodName](geoJSON);
  }

  throw new Error('Geometries of type ' + geometryType + ' are not supported yet');
};

GeometryFactory.prototype.createPointFromGeoJSON = function (geoJSON) {
  var lnglats = getGeometryCoordinates(geoJSON);
  var latlngs = convertLngLatsToLatLngs([ lnglats ]);
  return this.createPoint({
    latlng: latlngs[0],
    geojson: geoJSON,
    editable: true
  });
};

GeometryFactory.prototype.createPolylineFromGeoJSON = function (geoJSON) {
  var lnglats = getGeometryCoordinates(geoJSON);
  var latlngs = convertLngLatsToLatLngs(lnglats);
  return this.createPolyline({
    geojson: geoJSON,
    editable: true
  }, { latlngs: latlngs });
};

GeometryFactory.prototype.createPolygonFromGeoJSON = function (geoJSON) {
  var lnglats = getGeometryCoordinates(geoJSON)[0];
  var latlngs = convertLngLatsToLatLngs(lnglats);
  return this.createPolygon({
    geojson: geoJSON,
    editable: true
  }, { latlngs: latlngs });
};

GeometryFactory.prototype.createMultiPolygonFromGeoJSON = function (geoJSON) {
  var lnglats = getGeometryCoordinates(geoJSON);
  var latlngs = _.map(lnglats, function (lnglats) {
    return convertLngLatsToLatLngs(lnglats[0]);
  }, this);
  return this.createMultiPolygon({
    geojson: geoJSON,
    editable: true
  }, {
    latlngs: latlngs
  });
};

GeometryFactory.prototype.createMultiPolylineFromGeoJSON = function (geoJSON) {
  var lnglats = getGeometryCoordinates(geoJSON);
  var latlngs = _.map(lnglats, function (lnglats) {
    return convertLngLatsToLatLngs(lnglats);
  }, this);
  return this.createMultiPolyline({
    geojson: geoJSON,
    editable: true
  }, {
    latlngs: latlngs
  });
};

module.exports = GeometryFactory;
