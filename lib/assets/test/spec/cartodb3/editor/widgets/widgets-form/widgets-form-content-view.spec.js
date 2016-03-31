var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var WidgetsFormContentView = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-content-view');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widgets-form/widgets-form-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'foobar'
      }
    }, {
      parse: true,
      configModel: configModel,
      layerModel: {}
    });
    this.layerDefinitionModel.layerTableModel.set('fetched', true);
    this.layerDefinitionModel.layerTableModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);
    this.layerDefinitionsCollection = new Backbone.Collection([this.layerDefinitionModel]);

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l1',
      column: 'hello',
      operation: 'sum',
      prefix: 'my-prefix'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    this.widgetsFormContentView = new WidgetsFormContentView({
      widgetDefinitionModel: this.widgetDefinitionModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      stackLayoutModel: this.stackLayoutModel
    });
    this.widgetsFormContentView.render();
  });

  it('should generate the right tabs', function () {
    expect(this.widgetsFormContentView.$el.text()).toContain('editor.widgets.widgets-form.data.title');
    expect(this.widgetsFormContentView.$el.text()).toContain('editor.widgets.widgets-form.style.title');
  });

  it('should get back to the previous step if arrow is clicked', function () {
    this.widgetsFormContentView.$('.js-back').click();
    expect(this.stackLayoutModel.prevStep).toHaveBeenCalledWith('widgets');
  });
});
