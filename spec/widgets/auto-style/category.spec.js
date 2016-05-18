var CategoryAutoStyler = require('../../../src/widgets/auto-style/category.js');
var Backbone = require('backbone');

describe('src/widgets/auto-style/category', function () {
  beforeEach(function () {
    this.dataview = new Backbone.Model({
      allCategoryNames: ['a', 'b', 'c'],
      column: 'something'
    });

    this.layer = this.dataview.layer = jasmine.createSpyObj('layer', ['getGeometryType']);
    this.categoryAutoStyler = new CategoryAutoStyler(this.dataview);
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.layer.getGeometryType.and.returnValue('polygon');
      expect(this.categoryAutoStyler.getStyle().indexOf('[something=\'a\']{\npolygon-fill:')).not.toBeLessThan(0);
    });

    it('should generate the right styles when layer has points', function () {
      this.layer.getGeometryType.and.returnValue('marker');
      expect(this.categoryAutoStyler.getStyle().indexOf('[something=\'a\']{\nmarker-fill:')).not.toBeLessThan(0);
    });

    it('should generate the right styles when layer has lines', function () {
      this.layer.getGeometryType.and.returnValue('line');
      expect(this.categoryAutoStyler.getStyle().indexOf('[something=\'a\']{\nline-color:')).not.toBeLessThan(0);
    });
  });
});
