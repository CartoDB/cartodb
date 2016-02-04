var specHelper = require('../../spec-helper');
var WidgetModel = require('../../../src/widgets/widget-model');
var FormulaWidgetContent = require('../../../src/widgets/formula/content-view');
var AnimateValues = require('../../../src/widgets/animate-values');

describe('widgets/formula/content-view', function () {
  beforeEach(function () {
    AnimateValues.prototype.animateValue = function() {};
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createFormulaModel(vis.map.layers.first(), {});
    this.model = new WidgetModel({
      title: 'Max population'
    }, {
      dataviewModel: this.dataviewModel
    });
    this.view = new FormulaWidgetContent({
      model: this.model
    });
  });

  it('should render the formula', function () {
    this.dataviewModel.set('data', 100);
    expect(this.view.$('.js-title').text().trim()).toBe('Max population');
  });

  it('should render the collapsed formula', function () {
    this.dataviewModel.set('data', 123);
    this.model.set('collapsed', true);
    expect(this.view.$('.js-value').text()).toBe('123');
  });

  it('should not disable dataviewModel when it is collapsed', function() {
    this.model.set('collapsed', true);
    expect(this.dataviewModel.get('enabled')).toBeTruthy();
    this.dataviewModel.set('data', 67);
    expect(this.view.$('.js-value').text()).toBe('67');
  });
});
