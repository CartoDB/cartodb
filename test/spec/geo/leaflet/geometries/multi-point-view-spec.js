var _ = require('underscore');
var MultiPointView = require('../../../../../src/geo/leaflet/geometries/multi-point-view.js');
var MultiPoint = require('../../../../../src/geo/geometry-models/multi-point.js');

var GeoJSONHelper = require('./geojson-helper.js');

var multiPathToGeoJSONFunction = function (multiPath) {
  var coords = multiPath.points.map(function (path) {
    return GeoJSONHelper.convertLatLngsToGeoJSONPointCoords(path.getLatLng());
  });
  return {
    'type': 'MultiPoint',
    'coordinates': coords
  };
};

describe('src/geo/leaflet/geometries/multi-point-view.js', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.geometry = new MultiPoint(null, {
      latlngs: [
        [0, 1],
        [1, 2]
      ]
    });
    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);

    this.geometryView = new MultiPointView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });

    this.geometryView.render();
  });

  it('should render the paths', function () {
    expect(this.leafletMap.addLayer.calls.count()).toEqual(2); // 2 points
  });

  it('should update the geoJSON of the model', function () {
    expect(this.geometry.get('geojson')).toEqual(multiPathToGeoJSONFunction(this.geometry));
  });

  describe('when a path is updated', function () {
    it('should update the geoJSON of the model', function () {
      this.geometry.points.at(0).setLatLng([-1, 1]);
      expect(this.geometry.get('geojson')).toEqual(multiPathToGeoJSONFunction(this.geometry));
    });
  });

  describe('when the model is removed', function () {
    it('should remove each path', function () {
      this.geometry.points.each(function (polygon) {
        spyOn(polygon, 'remove');
      });

      this.geometry.remove();

      expect(this.geometry.points.all(function (polygon) {
        return polygon.remove.calls.count() === 1;
      })).toBe(true);
    });

    it('should remove the view', function () {
      spyOn(this.geometryView, 'remove');

      this.geometry.remove();

      expect(this.geometryView.remove).toHaveBeenCalled();
    });
  });
});
