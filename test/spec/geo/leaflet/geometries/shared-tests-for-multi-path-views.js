var _ = require('underscore');

module.exports = function (multiPathToGeoJSONFunction) {
  if (!multiPathToGeoJSONFunction) throw new Error('multiPathToGeoJSONFunction function is required');

  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.geometryView.render();
  });

  it('should render the paths', function () {
    expect(this.leafletMap.addLayer.calls.count()).toEqual(10); // 2 paths with 4 markers each
  });

  it('should update the geoJSON of the model', function () {
    expect(this.geometry.get('geojson')).toEqual(multiPathToGeoJSONFunction(this.geometry));
  });

  describe('when a path is updated', function () {
    it('should update the geoJSON of the model', function () {
      this.geometry.geometries.at(0).setLatLngs([
        [-1, 1], [1, 2], [3, 4], [-1, 1]
      ]);
      expect(this.geometry.get('geojson')).toEqual(multiPathToGeoJSONFunction(this.geometry));
    });
  });

  describe('when the model is removed', function () {
    it('should remove each path', function () {
      this.geometry.geometries.each(function (polygon) {
        spyOn(polygon, 'remove');
      });

      this.geometry.remove();

      expect(this.geometry.geometries.all(function (polygon) {
        return polygon.remove.calls.count() === 1;
      })).toBe(true);
    });

    it('should remove the view', function () {
      spyOn(this.geometryView, 'remove');

      this.geometry.remove();

      expect(this.geometryView.remove).toHaveBeenCalled();
    });
  });
};
