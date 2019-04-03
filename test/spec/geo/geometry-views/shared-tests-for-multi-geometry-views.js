var _ = require('underscore');

module.exports = function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.geometryView.render();
  });

  describe('when the model is removed', function () {
    it('should remove each geometry', function () {
      this.geometry.geometries.each(function (polygon) {
        spyOn(polygon, 'remove');
      });

      this.geometry.remove();

      expect(this.geometry.geometries.all(function (geometry) {
        return geometry.remove.calls.count() === 1;
      })).toBe(true);
    });

    it('should remove the view', function () {
      spyOn(this.geometryView, 'remove');

      this.geometry.remove();

      expect(this.geometryView.remove).toHaveBeenCalled();
    });
  });
};
