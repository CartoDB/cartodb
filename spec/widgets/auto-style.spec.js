var specHelper = require('../spec-helper');
var CategoryWidgetModel = require('../../src/widgets/category/category-widget-model');
describe('auto-style', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    layer.restoreCartoCSS = jasmine.createSpy('restore');
    layer.getGeometryType = function () {
      return 'polygon';
    };
    this.dataviewModel = vis.dataviews.createCategoryModel(layer, {
      column: 'col'
    });
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.autoStyler = this.widgetModel.autoStyler;
  });

  it('should generate some cartocss', function () {
    expect(typeof this.autoStyler.getStyle()).toEqual('string');
  });

  it('should generate category ramps', function () {
    this.dataviewModel.set('allCategoryNames', ['manolo', 'jacinto', 'eustaquio']);
    expect(this.autoStyler._generateCategoryRamp('marker').indexOf('marker-fill')).not.toBeLessThan(0);
    expect(this.autoStyler._generateCategoryRamp('polygon').indexOf('polygon-fill')).not.toBeLessThan(0);
    expect(this.autoStyler._generateCategoryRamp('line').indexOf('line-color')).not.toBeLessThan(0);
  });
});
