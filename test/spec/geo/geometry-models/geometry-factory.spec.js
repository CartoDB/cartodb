var _ = require('underscore');
var GeometryFactory = require('../../../../src/geo/geometry-models/geometry-factory');
var Point = require('../../../../src/geo/geometry-models/point');
var Polyline = require('../../../../src/geo/geometry-models/polyline');
var Polygon = require('../../../../src/geo/geometry-models/polygon');
var MultiPolygon = require('../../../../src/geo/geometry-models/multi-polygon');

var geometryAsFeature = function (geometry) {
  return {
    'type': 'Feature',
    'properties': {},
    'geometry': geometry
  };
};

var pointGeometry = {
  'type': 'Point',
  'coordinates': [
    -3.779296875,
    40.245991504199026
  ]
};

var polylineGeometry = {
  'type': 'LineString',
  'coordinates': [
    [
      -2.021484375,
      43.51668853502906
    ],
    [
      3.6035156249999996,
      42.293564192170095
    ]
  ]
};

var polygonGeometry = {
  'type': 'Polygon',
  'coordinates': [
    [
      [
        -8.96484375,
        41.918628865183045
      ],
      [
        -7.84423828125,
        43.74728909225908
      ],
      [
        -1.69189453125,
        43.34914966389313
      ]
    ]
  ]
};

describe('src/geo/geometry-models/geometry-factory', function () {
  beforeEach(function () {
    this.geometryFactory = new GeometryFactory();
  });

  describe('.createGeometryFromGeoJSON', function () {
    _.each([ pointGeometry, geometryAsFeature(pointGeometry) ], function (geoJSON) {
      it('should create a point', function () {
        var geometry = this.geometryFactory.createGeometryFromGeoJSON(geoJSON);

        expect(geometry instanceof Point).toBeTruthy();
        expect(geometry.getLatLng()).toEqual([ 40.245991504199026, -3.779296875 ]);
      });
    });

    _.each([ polylineGeometry, geometryAsFeature(polylineGeometry) ], function (geoJSON) {
      it('should create a point', function () {
        var geometry = this.geometryFactory.createGeometryFromGeoJSON(geoJSON);

        expect(geometry instanceof Polyline).toBeTruthy();
        expect(geometry.getLatLngs()).toEqual([ [ 43.51668853502906, -2.021484375 ], [ 42.293564192170095, 3.6035156249999996 ] ]);
      });
    });

    _.each([ polygonGeometry, geometryAsFeature(polygonGeometry) ], function (geoJSON) {
      it('should create a point', function () {
        var geometry = this.geometryFactory.createGeometryFromGeoJSON(geoJSON);

        expect(geometry instanceof Polygon).toBeTruthy();
        expect(geometry.getLatLngs()).toEqual([ [ 41.918628865183045, -8.96484375 ], [ 43.74728909225908, -7.84423828125 ], [ 43.34914966389313, -1.69189453125 ] ]);
      });
    });
  });
});
