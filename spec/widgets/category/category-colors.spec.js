var _ = require('underscore');
var CategoryColors = require('../../../src/widgets/auto-style/category-colors');

describe('widgets/category/category-colors', function () {
  beforeEach(function () {
    this.model = new CategoryColors();
  });

  it('should generate colors from the beginning', function () {
    expect(_.size(this.model.colors)).toBe(6);
  });

  describe('updateData', function () {
    it('should set a color per each category', function () {
      this.model.updateData(_generateData(7));
      var anyWithoutColor = false;
      _.each(this.model.colors, function (value, key) {
        if (!value) {
          anyWithoutColor = true;
        }
      });
      expect(anyWithoutColor).toBeFalsy();
    });

    it('should unset color<>category if that category is not present in the new data', function () {
      this.model.updateData(['ES', 'IT', 'PT', 'FR', 'AND', 'LUX', 'SUZ', 'SWD']);
      var color = this.model.getColorByCategory('PT');
      expect(this.model.getColorByCategory('PT')).not.toBe('#E1C221');
      this.model.updateData(['FR', 'AND']);
      expect(this.model.getCategoryByColor(color)).toBe(null);
    });

    it('should keep color if category remains in the data', function () {
      this.model.updateData(['ES', 'IT', 'PT', 'FR', 'AND', 'LUX', 'SUZ', 'SWD']);
      var color = this.model.getColorByCategory('ES');
      this.model.updateData(['IT', 'FR', 'ES']);
      expect(this.model.getColorByCategory('ES')).toBe(color);
    });

    it('should take first available color when a new category has arrived', function () {
      this.model.updateData(['ES', 'IT', 'PT', 'FR', 'AND', 'LUX', 'SUZ', 'SWD']);
      var color = this.model.getColorByCategory('IT');
      this.model.updateData(['ES', 'PT', 'FR', 'AND', 'NOR']);
      expect(this.model.getColorByCategory('NOR')).toBe(color);
      expect(this.model.getColorByCategory('IT')).toBe('#E1C221');
    });

    it('should not change colors if data changes but there is no new categories', function () {
      this.model.updateData(['ES', 'IT', 'PT', 'FR', 'AND', 'LUX', 'SUZ', 'SWD']);
      var luxColor = this.model.getColorByCategory('LUX');
      var andColor = this.model.getColorByCategory('AND');
      var esColor = this.model.getColorByCategory('ES');
      this.model.updateData(['LUX', 'AND', 'ES']);
      expect(this.model.getColorByCategory('LUX')).toBe(luxColor);
      expect(this.model.getColorByCategory('AND')).toBe(andColor);
      expect(this.model.getColorByCategory('ES')).toBe(esColor);
    });
  });

  describe('getColorByCategory', function () {
    it('should return the color from a category', function () {
      this.model.updateData(_generateData(7));
      expect(this.model.getColorByCategory('CAT3')).not.toBe('#E1C221');
      expect(this.model.getColorByCategory('CAT2')).not.toBe('#E1C221');
    });

    it('should return a default color if that category has not a color set', function () {
      this.model.updateData(_generateData(9));
      expect(this.model.getColorByCategory('CAT8')).toBe('#E1C221');
      expect(this.model.getColorByCategory('CAT9')).toBe('#E1C221');
      expect(this.model.getColorByCategory('@')).toBe('#E1C221');
    });
  });

  describe('getCategoryByColor', function () {
    it('should return the category from a color', function () {
      this.model.updateData(_generateData(10));
      expect(this.model.getCategoryByColor('#2CA095')).not.toBeUndefined();
      expect(this.model.getCategoryByColor('#559030')).not.toBeUndefined();
    });

    it('should return undefined if color is not defined', function () {
      this.model.updateData(_generateData(20));
      expect(this.model.getCategoryByColor('#FABADA')).toBeUndefined();
      expect(this.model.getCategoryByColor('@')).toBeUndefined();
    });
  });
});

function _generateData (n) {
  return _.times(n, function (i) {
    return 'CAT' + i;
  });
}
