var specHelper = require('../spec-helper');
var CategoryWidgetModel = require('../../src/widgets/category/category-widget-model');

describe('auto-style', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    layer.restoreCartoCSS = jasmine.createSpy('restore');
    layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    this.dataviewModel = vis.dataviews.createCategoryModel(layer, {
      column: 'col'
    });
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    }, {autoStyleEnabled: true});
    this.autoStyler = this.widgetModel.autoStyler;
  });

  it('should generate some cartocss', function () {
    expect(typeof this.autoStyler.getStyle()).toEqual('string');
  });

  it('should generate category ramps', function () {
    this.dataviewModel.set('allCategoryNames', ['manolo', 'jacinto', 'eustaquio']);
    expect(this.autoStyler._getFillColor('marker-fill')).toContain('ramp([col],');
    expect(this.autoStyler._getFillColor('polygon-fill')).toContain('ramp([col],');
    expect(this.autoStyler._getFillColor('line-color')).toContain('ramp([col],');
  });
});
