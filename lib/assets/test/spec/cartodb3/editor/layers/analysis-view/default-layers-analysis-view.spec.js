var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var cdb = require('cartodb.js');
var DefaultLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/default-layer-analysis-view');

describe('editor/layers/analysis-views/default-layer-analysis-view', function () {
  beforeEach(function () {
    this.model = new AnalysisDefinitionNodeModel({
      id: 'a3',
      type: 'trade-area',
      kind: 'walk',
      time: 300,
      source_id: 'a2'
    });

    this.view = new DefaultLayerAnalysisView({
      model: this.model,
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

  describe('draggable helper', function () {
    it('should add a helper by default', function () {
      var view = new DefaultLayerAnalysisView({
        model: this.model,
        layerDefinitionModel: new cdb.core.Model()
      });
      view.render();
      expect(view.draggableHelperView).toBeDefined();
    });
    it('should allow to avoid adding a helper', function () {
      var view = new DefaultLayerAnalysisView({
        model: this.model,
        layerDefinitionModel: new cdb.core.Model(),
        isDraggable: false
      });
      view.render();
      expect(view.draggableHelperView).not.toBeDefined();
    });
  });
});
