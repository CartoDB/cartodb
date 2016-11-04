var _ = require('underscore');
var GeometryFactory = require('../../../../src/geo/geometry-models/geometry-factory');
var Point = require('../../../../src/geo/geometry-models/point');
var Polyline = require('../../../../src/geo/geometry-models/polyline');
var Polygon = require('../../../../src/geo/geometry-models/polygon');
var MultiPoint = require('../../../../src/geo/geometry-models/multi-point');
var MultiPolygon = require('../../../../src/geo/geometry-models/multi-polygon');
var MultiPolyline = require('../../../../src/geo/geometry-models/multi-polyline');

var geometryAsFeature = function (geometry) {
  return {
    'type': 'Feature',
    'properties': {},
    'geometry': geometry
  };
};

describe('src/geo/geometry-models/geometry-factory', function () {
  describe('.createGeometryFromGeoJSON', function () {
    var pointGeometry = {
      'type': 'Point',
      'coordinates': [
        -3.779296875,
        40.245991504199026
      ]
    };

    _.each([ pointGeometry, geometryAsFeature(pointGeometry) ], function (geoJSON) {
      it('should create a point', function () {
        var geometry = GeometryFactory.createGeometryFromGeoJSON(geoJSON);

        expect(geometry instanceof Point).toBeTruthy();
        expect(geometry.getCoordinates()).toEqual([ 40.245991504199026, -3.779296875 ]);
      });
    });

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

    _.each([ polylineGeometry, geometryAsFeature(polylineGeometry) ], function (geoJSON) {
      it('should create a polyline', function () {
        var geometry = GeometryFactory.createGeometryFromGeoJSON(geoJSON);

        expect(geometry instanceof Polyline).toBeTruthy();
        expect(geometry.getCoordinates()).toEqual([
          [ 43.51668853502906, -2.021484375 ],
          [ 42.293564192170095, 3.6035156249999996 ]
        ]);
      });
    });

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
          ],
          [
            -8.96484375,
            41.918628865183045
          ]
        ]
      ]
    };

    _.each([ polygonGeometry, geometryAsFeature(polygonGeometry) ], function (geoJSON) {
      it('should create a polygon', function () {
        var geometry = GeometryFactory.createGeometryFromGeoJSON(geoJSON);

        expect(geometry instanceof Polygon).toBeTruthy();
        expect(geometry.getCoordinates()).toEqual([
          [ 41.918628865183045, -8.96484375 ],
          [ 43.74728909225908, -7.84423828125 ],
          [ 43.34914966389313, -1.69189453125 ]
        ]);
      });
    });

    var multiPointGeometry = {
      'type': 'MultiPoint',
      'coordinates': [ [100.0, 0.0], [101.0, 1.0] ]
    };

    it('should create a multipoint', function () {
      var geometry = GeometryFactory.createGeometryFromGeoJSON(multiPointGeometry);

      expect(geometry instanceof MultiPoint).toBeTruthy();
      expect(geometry.geometries.length).toEqual(2);
      expect(geometry.geometries.at(0).getCoordinates()).toEqual([ 0, 100 ]);
      expect(geometry.geometries.at(1).getCoordinates()).toEqual([ 1, 101 ]);
    });

    var multiPolygonGeometry = {
      'type': 'MultiPolygon',
      'coordinates': [
        [ [ [102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0] ] ],
        [ [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ] ]
      ]
    };

    it('should create a multipolygon', function () {
      var geometry = GeometryFactory.createGeometryFromGeoJSON(multiPolygonGeometry);

      expect(geometry instanceof MultiPolygon).toBeTruthy();
      expect(geometry.geometries.length).toEqual(2);
      expect(geometry.geometries.at(0).getCoordinates()).toEqual([ [ 2, 102 ], [ 2, 103 ], [ 3, 103 ], [ 3, 102 ] ]);
      expect(geometry.geometries.at(1).getCoordinates()).toEqual([ [ 0, 100 ], [ 0, 101 ], [ 1, 101 ], [ 1, 100 ] ]);
    });

    var multiPolylineGeometry = {
      'type': 'MultiLineString',
      'coordinates': [
        [ [100.0, 0.0], [101.0, 1.0] ],
        [ [102.0, 2.0], [103.0, 3.0] ]
      ]
    };

    it('should create a multipolyline', function () {
      var geometry = GeometryFactory.createGeometryFromGeoJSON(multiPolylineGeometry);

      expect(geometry instanceof MultiPolyline).toBeTruthy();
      expect(geometry.geometries.length).toEqual(2);
      expect(geometry.geometries.at(0).getCoordinates()).toEqual([ [ 0, 100 ], [ 1, 101 ] ]);
      expect(geometry.geometries.at(1).getCoordinates()).toEqual([ [ 2, 102 ], [ 3, 103 ] ]);
    });
  });
});
