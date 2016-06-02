/**
 * Value object for a gebom or geom_webmercator raw value from a postgres table.
 */

var POLYGON = 'polygon';
var POINT = 'point';
var LINE = 'line';

var WKT_TYPES = [
  'POINT',
  'LINESTRING',
  'POLYGON',
  'MULTIPOINT',
  'MULTILINESTRING',
  'MULTIPOLYGON'
];
var WKB_TYPES_MAP = {
  '0001': 'Point',
  '0002': 'LineString',
  '0003': 'Polygon',
  '0004': 'MultiPoint',
  '0005': 'MultiLineString',
  '0006': 'MultiPolygon'
};

var GEO_MAP = {
  'point': {
    postgres: 'ST_Point',
    simple: POINT
  },
  'linestring': {
    postgres: 'ST_LineString',
    simple: LINE
  },
  'polygon': {
    postgres: 'ST_Polygon',
    simple: POLYGON
  },
  'multipoint': {
    postgres: 'ST_MultiPoint',
    simple: POINT
  },
  'multilinestring': {
    postgres: 'ST_MultiLineString',
    simple: LINE
  },
  'multipolygon': {
    postgres: 'ST_MultiPolygon',
    simple: POLYGON
  }
};

var geometryTypeFromWKT = function (wkt) {
  if (!wkt) return null;
  wkt = wkt.toUpperCase();
  for (var i = 0; i < WKT_TYPES.length; ++i) {
    var t = WKT_TYPES[i];
    if (wkt.indexOf(t) !== -1) {
      return t;
    }
  }
};

var geometryTypeFromWKB = function (wkb) {
  if (!wkb) return null;

  var bigendian = wkb[0] === '0' && wkb[1] === '0';
  var type = wkb.substring(2, 6);
  if (!bigendian) {
    // swap '0100' => '0001'
    type = type[2] + type[3] + type[0] + type[1];
  }
  return WKB_TYPES_MAP[type];
};

var createGeometry = function (rawGeom) {
  var geoType = geometryTypeFromWKB(rawGeom) || geometryTypeFromWKT(rawGeom);
  if (!geoType) throw Error('invalid geom: ' + rawGeom);

  var map = GEO_MAP[geoType.toLowerCase()];

  return {
    getRawGeometry: function () {
      return rawGeom;
    },

    getPostgresType: function () {
      return map.postgres;
    },

    getSimpleType: function () {
      return map.simple;
    }
  };
};

// For easier testing
createGeometry.ex = function (simpleType) {
  switch (simpleType) {
    case POLYGON: return createGeometry('0106000');
    case POINT: return createGeometry('0101000');
    case LINE: return createGeometry('LINESTRING');
  }
};

module.exports = createGeometry;
