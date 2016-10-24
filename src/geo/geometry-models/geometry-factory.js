var _ = require('underscore');
var L = require('leaflet');
var Point = require('./point');
var Polyline = require('./polyline');
var Polygon = require('./polygon');
var MultiPolygon = require('./multi-polygon');

var GEOJSON_TYPE_TO_CREATE_METHOD_NAME = {
  Point: 'createPointFromGeoJSON',
  LineString: 'createPolylineFromGeoJSON',
  Polygon: 'createPolygonFromGeoJSON',
  MultiPolygon: 'createMultiPolygonFromGeoJSON'
};

var getGeometryType = function (geoJSON) {
  return (geoJSON.geometry && geoJSON.geometry.type) ||
    geoJSON.type;
};

var getGeometryCoordinates = function (geoJSON) {
  return (geoJSON.geometry && geoJSON.geometry.coordinates) ||
    geoJSON.coordinates;
};

var getLatLngsFromCoordinates = function (coords) {
  var latlngs = L.GeoJSON.coordsToLatLngs(coords);
  return _.chain(latlngs)
    .map(function (latlng) {
      return [latlng.lat, latlng.lng];
    })
    .uniq()
    .value();
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

GeometryFactory.prototype.createGeometryFromGeoJSON = function (geoJSON) {
  var geometryType = getGeometryType(geoJSON);
  var methodName = GEOJSON_TYPE_TO_CREATE_METHOD_NAME[geometryType];
  if (methodName) {
    return this[methodName](geoJSON);
  }

  throw new Error('Geometries of type ' + geometryType + ' are not supported yet');
};

GeometryFactory.prototype.createPointFromGeoJSON = function (geoJSON) {
  var coords = getGeometryCoordinates(geoJSON);
  var latlngs = getLatLngsFromCoordinates([ coords ]);
  return this.createPoint({
    latlng: latlngs[0],
    geojson: geoJSON,
    editable: true
  });
};

GeometryFactory.prototype.createPolylineFromGeoJSON = function (geoJSON) {
  var coords = getGeometryCoordinates(geoJSON);
  var latlngs = getLatLngsFromCoordinates(coords);
  return this.createPolyline({
    geojson: geoJSON,
    editable: true
  }, { latlngs: latlngs });
};

GeometryFactory.prototype.createPolygonFromGeoJSON = function (geoJSON) {
  var coords = getGeometryCoordinates(geoJSON)[0];
  var latlngs = getLatLngsFromCoordinates(coords);
  return this.createPolygon({
    geojson: geoJSON,
    editable: true
  }, { latlngs: latlngs });
};

GeometryFactory.prototype.createMultiPolygonFromGeoJSON = function (geoJSON) {
  var coords = getGeometryCoordinates(geoJSON);
  var latlngs = _.map(coords, function (coords) {
    return getLatLngsFromCoordinates(coords[0]);
  }, this);
  return this.createMultiPolygon({
    geojson: geoJSON,
    editable: true
  }, {
    latlngs: latlngs
  });
};

module.exports = GeometryFactory;
