var specHelper = require('../../spec-helper');
var WidgetModel = require('../../../src/widgets/widget-model');
var FormulaWidgetContent = require('../../../src/widgets/formula/content-view');
var AnimateValues = require('../../../src/widgets/animate-values');

describe('widgets/formula/content-view', function () {
  beforeEach(function () {
    AnimateValues.prototype.animateValue = function () {};
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createFormulaModel(vis.map.layers.first(), {
      column: 'col',
      source: {
        id: 'a0'
      },
      operation: 'avg'
    });
    this.model = new WidgetModel({
      title: 'Max population',
      hasInitialState: true
    }, {
      dataviewModel: this.dataviewModel
    });
    this.view = new FormulaWidgetContent({
      model: this.model
    });
    this.view.render();
  });

  it('should render the formula', function () {
    this.dataviewModel.set('data', 100);
    expect(this.view.$('.js-title').text()).toContain('Max population');
  });

  it('should render the collapsed formula', function () {
    this.dataviewModel.set('data', 123);
    this.model.set('collapsed', true);
    expect(this.view.$('.js-value').text()).toBe('123');
  });

  it('should render description if available', function () {
    this.dataviewModel.set('data', 123);
    expect(this.view.$('.js-description').length).toBe(0);
    this.model.set('description', 'hello');
    this.view.render();
    expect(this.view.$('.js-description').length).toBe(1);
    expect(this.view.$('.js-description').text()).toBe('hello');
  });

  it('should not disable dataviewModel when it is collapsed', function () {
    this.model.set('collapsed', true);
    expect(this.dataviewModel.get('enabled')).toBeTruthy();
    this.dataviewModel.set('data', 67);
    expect(this.view.$('.js-value').text()).toBe('67');
  });

  it('should render formula stats if show_stats is enabled', function () {
    expect(this.view.$('.CDB-Widget-info').length).toBe(0);
    this.model.set('show_stats', true);
    this.view.render();
    expect(this.view.$('.CDB-Widget-info').length).toBe(1);
  });

  it('should render widget source if show_source is enabled', function () {
    expect(this.view.$('.CDB-Widget-info').length).toBe(0);
    this.model.set('show_source', true);
    this.view.render();
    expect(this.view.$('.CDB-Widget-info').length).toBe(1);
  });
});
