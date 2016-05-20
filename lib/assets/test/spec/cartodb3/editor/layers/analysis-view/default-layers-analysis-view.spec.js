var cdb = require('cartodb.js');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var DefaultLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/default-layer-analysis-view');

describe('editor/layers/analysis-views/default-layer-analysis-view', function () {
  beforeEach(function () {
    this.model = new AnalysisDefinitionNodeModel({
      id: 'a3',
      type: 'trade-area',
      kind: 'walk',
      time: 300,
      source: 'a2'
    }, {
      configModel: {},
      sqlAPI: {}
    });

    this.analysisNode = new cdb.core.Model();

    this.view = new DefaultLayerAnalysisView({
      model: this.model,
      analysisNode: this.analysisNode,
      layerDefinitionModel: new cdb.core.Model()
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title', function () {
    expect(this.view.$el.text()).toContain('analyses.area-of-influence');
  });

  it('should render the loading until ready', function () {
    expect(this.view.$el.html()).toContain('Loader');
    expect(this.view.$el.text()).not.toContain('a3');
  });

  describe('when analysis node is ready', function () {
    beforeEach(function () {
      this.analysisNode.set('status', 'ready');
    });

    it('should render id', function () {
      expect(this.view.$el.text()).toContain('a3');
      expect(this.view.$el.html()).not.toContain('Loader');
    });
  });

  describe('draggable helper', function () {
    it('should add a helper by default', function () {
      var view = new DefaultLayerAnalysisView({
        model: this.model,
        analysisNode: this.analysisNode,
        layerDefinitionModel: new cdb.core.Model()
      });
      view.render();
      expect(view.draggableHelperView).toBeDefined();
    });
    it('should allow to avoid adding a helper', function () {
      var view = new DefaultLayerAnalysisView({
        model: this.model,
        analysisNode: this.analysisNode,
        layerDefinitionModel: new cdb.core.Model(),
        isDraggable: false
      });
      view.render();
      expect(view.draggableHelperView).not.toBeDefined();
    });
  });
});
