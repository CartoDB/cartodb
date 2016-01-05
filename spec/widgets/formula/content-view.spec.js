var FormulaDataviewModel = require('../../../src/dataviews/formula-dataview-model');
var WidgetModel = require('../../../src/widgets/widget-model');
var FormulaWidgetContent = require('../../../src/widgets/formula/content-view');

describe('widgets/formula/content-view', function () {
  beforeEach(function () {
    this.dataviewModel = new FormulaDataviewModel({
    });
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
    this.dataviewModel.set({
      data: 100
    });
    expect(this.view.$('.js-title').text().trim()).toBe('Max population');
  });

  it('should render the collapsed formula', function () {
    this.dataviewModel.set('data', 123);
    this.model.set('collapsed', true);
    expect(this.view.$('.js-title').text()).toBe('123');
  });
});
