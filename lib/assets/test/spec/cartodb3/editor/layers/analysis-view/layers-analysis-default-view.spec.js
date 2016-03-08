var cdb = require('cartodb.js');
var LayerAnalysisViewFactory = require('../../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var LayerAnalysisDefaultView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/layer-analysis-default-view');
var AnalysisTradeAreaDefinitionModel = require('../../../../../../javascripts/cartodb3/data/analysis-definitions/analysis-trade-area-definition-model');

describe('editor/layers/analysis-views/layer-analysis-node-view', function () {
  beforeEach(function () {
    this.analysisDefinitionModel = new AnalysisTradeAreaDefinitionModel({
      id: 'a3',
      table_name: 'districts'
    }, {
      configModel: {}
    });

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory({});
    this.sourceView = new cdb.core.View();
    this.sourceView.render = function () {
      return this.$el.html('thesource');
      return this;
    };
    spyOn(this.layerAnalysisViewFactory, 'createView').and.returnValue(this.sourceView);

    this.layerDefinitionModel = {};

    this.view = new LayerAnalysisDefaultView({
      model: this.analysisDefinitionModel,
      layerDefinitionModel: this.layerDefinitionModel,
      layerAnalysisViewFactory: this.layerAnalysisViewFactory
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title', function () {
    expect(this.view.$el.text()).toContain('trade-area');
  });

  it('should render id', function () {
    expect(this.view.$el.text()).toContain('a3');
  });

  it('should render source view as next node', function () {
    expect(this.view.$el.text()).toContain('thesource');
    expect(this.layerAnalysisViewFactory.calls.argsFor(0)[0]).toEqual('a3');
    expect(this.layerAnalysisViewFactory.calls.argsFor(0)[1]).toBe(this.layerDefinitionModel);
  });
});
