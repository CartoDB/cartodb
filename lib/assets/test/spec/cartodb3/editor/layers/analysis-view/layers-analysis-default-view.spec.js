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

    this.view = new LayerAnalysisDefaultView({
      model: this.analysisDefinitionModel
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
});
