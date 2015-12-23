var DataviewModel = require('../../../src/dataviews/dataview-model');
var WidgetContentView = require('../../../src/widgets/standard/widget-content-view');

describe('widgets/standard/widget-content-view', function () {
  beforeEach(function () {
    this.model = new DataviewModel({
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
