var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var LayerTableModel = require('../../../../../../javascripts/cartodb3/data/layer-table-model');
var WidgetsFormContentView = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-content-view');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widgets-form/widgets-form-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
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
      configModel: configModel,
      layerDefinitionModel: {},
      dashboardWidgetsService: {}
    });

    this.layerTableModel = new LayerTableModel({
      table_name: 'foobar',
      fetched: true
    }, {
      configModel: configModel
    });

    this.layerTableModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);

    this.widgetsFormContentView = new WidgetsFormContentView({
      layerTableModel: this.layerTableModel,
      widgetDefinitionModel: this.widgetDefinitionModel
    });
    this.widgetsFormContentView.render();
  });

  it('should generate the right tabs', function () {
    expect(this.widgetsFormContentView.$el.text()).toContain('editor.widgets.widgets-form.data.title');
    expect(this.widgetsFormContentView.$el.text()).toContain('editor.widgets.widgets-form.style.title');
  });
});
