var _ = require('underscore');
var MultiPolygonView = require('../../../../../src/geo/leaflet/geometries/multi-polygon-view.js');
var MultiPolygon = require('../../../../../src/geo/geometry-models/multi-polygon.js');

describe('src/geo/leaflet/geometries/multi-polygon-view.js', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.multiPolygon = new MultiPolygon(null, {
      latlngs: [
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4]
        ],
        [
          [0, 10],
          [10, 20],
          [20, 30],
          [30, 40]
        ]
      ]
    });
    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);

    this.multiPolygonView = new MultiPolygonView({
      model: this.multiPolygon,
      nativeMap: this.leafletMap
    });

    this.multiPolygonView.render();
  });

  it('should render the polygons', function () {
    expect(this.leafletMap.addLayer.calls.count()).toEqual(10); // 2 polygons with 4 markers each
  });

  it('should update the geoJSON of the model', function () {
    expect(this.multiPolygon.get('geojson')).toEqual({
      'type': 'MultiPolygon',
      'coordinates': [
        [ [ [1, 0], [2, 1], [3, 2], [4, 3], [1, 0] ] ],
        [ [ [10, 0], [20, 10], [30, 20], [40, 30], [10, 0] ] ]
      ]
    });
  });

  describe('when a polygon is updated', function () {
    it('should update the geoJSON of the model', function () {
      this.multiPolygon.polygons.at(0).setLatLngs([
        [-1, 1], [1, 2], [3, 4], [-1, 1]
      ]);
      expect(this.multiPolygon.get('geojson')).toEqual({
        'type': 'MultiPolygon',
        'coordinates': [
          [ [ [1, -1], [2, 1], [4, 3], [1, -1], [1, -1] ] ],
          [ [ [10, 0], [20, 10], [30, 20], [40, 30], [10, 0] ] ]
        ]
      });
    });
  });

  describe('when the model is removed', function () {
    it('should remove each polygon', function () {
      this.multiPolygon.polygons.each(function (polygon) {
        spyOn(polygon, 'remove');
      });

      this.multiPolygon.remove();

      expect(this.multiPolygon.polygons.all(function (polygon) {
        return polygon.remove.calls.count() === 1;
      })).toBe(true);
    });

    it('should remove the view', function () {
      spyOn(this.multiPolygonView, 'remove');

      this.multiPolygon.remove();

      expect(this.multiPolygonView.remove).toHaveBeenCalled();
    });
  });
});
