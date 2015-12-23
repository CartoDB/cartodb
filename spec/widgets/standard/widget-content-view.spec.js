var DataviewModel = require('../../../src/dataviews/dataview-model');
var WidgetModel = require('../../../src/widgets/widget-model');
var WidgetContentView = require('../../../src/widgets/standard/widget-content-view');

describe('widgets/standard/widget-content-view', function () {
  beforeEach(function () {
    this.dataviewModel = new DataviewModel({
      id: 'widget_3',
      title: 'Howdy',
      columns: ['cartodb_id', 'title']
    });
    this.model = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });

    spyOn(this.dataviewModel, 'bind').and.callThrough();

    this.view = new WidgetContentView({
      model: this.model
    });
  });

  it('should have a bind from the beginning', function () {
    expect(this.dataviewModel.bind.calls.argsFor(0)[0]).toEqual('change:data');
  });

  describe('render', function () {
    it('should render placeholder when data is empty', function () {
      spyOn(this.view, '_addPlaceholder');
      this.dataviewModel.set('data', '');
      expect(this.view._addPlaceholder).toHaveBeenCalled();
    });
  });
});
