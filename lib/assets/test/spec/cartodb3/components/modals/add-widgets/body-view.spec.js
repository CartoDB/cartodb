var cdb = require('cartodb.js');
var Backbone = require('backbone');
var BodyView = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/body-view');
var widgetsTypes = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/widgets-types');

describe('components/modals/add-widgets/body-view', function () {
  beforeEach(function () {
    var layerDefinitionModel = new cdb.core.Model();
    layerDefinitionModel.getName = function () { return 'layer'; };

    var analysisDefinitionModel = new cdb.core.Model();

    var tuples = [{
      columnModel: new cdb.core.Model(),
      analysisDefinitionModel: analysisDefinitionModel,
      layerDefinitionModel: layerDefinitionModel
    }];
    this.optionsCollection = new Backbone.Collection([
      {
        type: 'category',
        layer_index: 0,
        tuples: tuples
      }, {
        type: 'histogram',
        layer_index: 0,
        tuples: tuples
      }, {
        type: 'formula',
        layer_index: 0,
        tuples: tuples
      }, {
        type: 'time-series',
        layer_index: 0,
        tuples: tuples
      }
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
