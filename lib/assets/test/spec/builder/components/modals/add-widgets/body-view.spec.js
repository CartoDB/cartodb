var Backbone = require('backbone');
var BodyView = require('builder/components/modals/add-widgets/body-view');
var WidgetOptionModel = require('builder/components/modals/add-widgets/widget-option-model');
var widgetsTypes = require('builder/components/modals/add-widgets/widgets-types');

describe('components/modals/add-widgets/body-view', function () {
  beforeEach(function () {
    var layerDefinitionModel = new Backbone.Model();
    layerDefinitionModel.getColor = function () { return '#fabada'; };
    layerDefinitionModel.getName = function () { return 'layer'; };
    layerDefinitionModel.getTableName = function () { return 'table_name'; };

    var analysisDefinitionNodeModel = new Backbone.Model({
      id: 'a1'
    });
    analysisDefinitionNodeModel.isSourceType = function () {
      return true;
    };

    var tuples = [{
      columnModel: new Backbone.Model(),
      analysisDefinitionNodeModel: analysisDefinitionNodeModel,
      layerDefinitionModel: layerDefinitionModel
    }];
    this.optionsCollection = new Backbone.Collection([
      new WidgetOptionModel({
        type: 'category',
        layer_index: 0,
        tuples: tuples
      }),
      new WidgetOptionModel({
        type: 'histogram',
        layer_index: 0,
        tuples: tuples
      }),
      new WidgetOptionModel({
        type: 'formula',
        layer_index: 0,
        tuples: tuples
      }),
      new WidgetOptionModel({
        type: 'time-series',
        layer_index: 0,
        tuples: tuples
      })
    ]);

    this.view = new BodyView({
      optionsCollection: this.optionsCollection,
      widgetsTypes: widgetsTypes
    });
    this.view = this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render fine', function () {
    expect(this.view).toBeDefined();
  });

  it('should create tab pane items when there is at least one option of that type', function () {
    expect(this.view.$el.html()).toContain('formula');
    expect(this.view.$el.html()).toContain('category');
    expect(this.view.$el.html()).toContain('histogram');
    expect(this.view.$el.html()).toContain('time-series');
  });
});
