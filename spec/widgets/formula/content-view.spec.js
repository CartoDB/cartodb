var WidgetFormulaModel = require('../../../src/widgets/formula/model');
var WidgetFormulaContent = require('../../../src/widgets/formula/content-view');

describe('widgets/list/content-view', function () {
  beforeEach(function () {
    this.model = new WidgetFormulaModel({
      id: 'widget_3',
      title: 'Max population'
    });
    this.view = new WidgetFormulaContent({
      model: this.model
    });
  });

  it('should render the formula', function () {
    spyOn(this.view, 'render').and.callThrough();
    this.view._initBinds();
    this.model.set({ data: 100 });
    this.model.trigger('change:data', this.model);
    expect(this.view.render).toHaveBeenCalled();
    expect(this.view.$('.js-title').text().trim()).toBe('Max population');
  });

  it('should render the formula', function () {
    spyOn(this.view, 'render').and.callThrough();
    this.view._initBinds();
    this.model.set({ data: 123, collapsed: true });
    this.view.render();
    expect(this.view.$('.js-title').text()).toBe('123');
  });
});
