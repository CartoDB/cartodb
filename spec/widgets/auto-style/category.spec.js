var specHelper = require('../../spec-helper');
var CategoryAutoStyler = require('../../../src/widgets/auto-style/category.js');
var Backbone = require('backbone');

describe('src/widgets/auto-style/category', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    this.dataview = new Backbone.Model({
      allCategoryNames: ['a', 'b', 'c'],
      column: 'something'
    });
    this.layer = this.dataview.layer = layer;
    this.categoryAutoStyler = new CategoryAutoStyler(this.dataview);
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.dataview.layer.set('initialStyle', '#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: #e49115;  polygon-fill-opacity: 0.9; }');
      var style = this.categoryAutoStyler.getStyle();
      expect(style.indexOf('[something=\'a\']{\npolygon-fill:')).not.toBeLessThan(0);
    });

    it('should generate the right styles when layer has points', function () {
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.categoryAutoStyler.getStyle().indexOf('[something=\'a\']{\nmarker-fill:')).not.toBeLessThan(0);
    });

    it('should generate the right styles when layer has lines', function () {
      this.dataview.layer.set('initialStyle', '#layer {  line-width: 0.5;  line-color: #fcfafa;  line-opacity: 1; }');
      expect(this.categoryAutoStyler.getStyle().indexOf('[something=\'a\']{\nline-color:')).not.toBeLessThan(0);
    });
  });
});
