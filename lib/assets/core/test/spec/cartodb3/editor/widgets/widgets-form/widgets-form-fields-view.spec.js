var $ = require('jquery');
var _ = require('underscore');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var WidgetsFormFieldsView = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-fields-view');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');

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
    this.view.render();
  });

  describe('.validateForm', function () {
    it('should call _widgetFormView.validate()', function () {
      spyOn(this.view._widgetFormView, 'validate');

      this.view.validateForm();

      expect(this.view._widgetFormView.validate).toHaveBeenCalled();
    });
  });
});
