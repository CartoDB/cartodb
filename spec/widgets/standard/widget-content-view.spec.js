var WidgetModel = require('../../../src/widgets/widget-model');
var WidgetContentView = require('../../../src/widgets/standard/widget-content-view');

describe('widgets/standard/widget-content-view', function () {
  beforeEach(function () {
    this.model = new WidgetModel({
      id: 'widget_3',
      title: 'Howdy',
      columns: ['cartodb_id', 'title']
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new WidgetContentView({
      model: this.model
    });
  });

  it('should have a bind from the beginning', function () {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:data');
  });

  describe('render', function () {
    it('should render placeholder when data is empty', function () {
      spyOn(this.view, '_addPlaceholder');
      this.model.set('data', '');
      expect(this.view._addPlaceholder).toHaveBeenCalled();
    });
  });
});
