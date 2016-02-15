var Backbone = require('backbone');
var WidgetsFormContentView = require('../../../../../../../javascripts/cartodb3/editor/map/widgets/widgets-form/widgets-form-content-view');
var WidgetDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/map/widgets/widgets-form/widgets-form-content-view', function () {
  beforeEach(function () {
    this.widgetDefinitionModel = new WidgetDefinitionModel({
      layer_id: 'w-456',
      title: 'some title',
      type: 'formula',
      options: {
        column: 'hello',
        operation: 'sum',
        prefix: 'my-prefix'
      }
    }, {
      baseUrl: '/u/pepe',
      layerDefinitionModel: {},
      dashboardWidgetsService: {}
    });

    this.columnsCollection = new Backbone.Collection();
    this.tableModel = new cdb.core.Model({
      fetched: true,
      columnsCollection: this.columnsCollection
    });

    this.tableModel.columnsCollection = this.columnsCollection;

    this.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);

    this.widgetsFormContentView = new WidgetsFormContentView({
      tableModel: this.tableModel,
      widgetDefinitionModel: this.widgetDefinitionModel
    });
    this.widgetsFormContentView.render();
  });

  it('should generate the right tabs', function () {
    expect(this.widgetsFormContentView.$el.text()).toContain('editor.widgets.widgets-form.data');
    expect(this.widgetsFormContentView.$el.text()).toContain('editor.widgets.widgets-form.style');
  });
});
