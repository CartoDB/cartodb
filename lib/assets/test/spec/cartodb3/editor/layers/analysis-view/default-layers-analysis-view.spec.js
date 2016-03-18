var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var cdb = require('cartodb.js');
var DefaultLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/default-layer-analysis-view');

describe('editor/layers/analysis-views/default-layer-analysis-view', function () {
  beforeEach(function () {
    var model = new AnalysisDefinitionNodeModel({
      id: 'a3',
      type: 'trade-area',
      kind: 'walk',
      time: 300,
      source_id: 'a2'
    });

    this.view = new DefaultLayerAnalysisView({
      model: model,
      layerDefinitionModel: new cdb.core.Model()
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
