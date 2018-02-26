var QuerySchemaModel = require('builder/data/query-schema-model');
var WidgetsFormFieldsView = require('builder/editor/widgets/widgets-form/widgets-form-fields-view');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');

describe('editor/widgets/widgets-form/widgets-form-fields-view', function () {
  beforeEach(function () {
    var querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: {}
    });
    querySchemaModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l1',
      source: 'a0',
      column: 'hello',
      operation: 'sum'
    }, {
      configModel: {},
      mapId: 'm-123'
    });

    this.view = new WidgetsFormFieldsView({
      userActions: {},
      widgetDefinitionModel: this.widgetDefinitionModel,
      querySchemaModel: querySchemaModel,
      configModel: {},
      userModel: {},
      modals: {}
    });

    spyOn(this.view, 'render').and.callThrough();

    this.view.render();
  });

  describe('.validateForm', function () {
    it('should call _widgetFormView.validate()', function () {
      spyOn(this.view._widgetFormView, 'validate');

      this.view.validateForm();

      expect(this.view._widgetFormView.validate).toHaveBeenCalled();
    });
  });

  it('should call .render if _widgetFormModel change:column, change:aggregation or changeSchema is triggered', function () {
    this.view._widgetFormModel.trigger('change:column');
    expect(this.view.render).toHaveBeenCalled();

    this.view._widgetFormModel.trigger('change:aggregation');
    expect(this.view.render).toHaveBeenCalled();

    this.view._widgetFormModel.trigger('changeSchema');
    expect(this.view.render).toHaveBeenCalled();
  });
});
