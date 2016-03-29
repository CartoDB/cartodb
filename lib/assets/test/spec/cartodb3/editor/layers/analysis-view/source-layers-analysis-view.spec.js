var SourceLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/source-layer-analysis-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('editor/layers/analysis-views/source-layer-analysis-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([{
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM foo'
      }
    }], {
      sqlAPI: {}
    });
    this.sourceAnalysisDefinitionNodeModel = this.analysisDefinitionNodesCollection.get('a0');

    this.layerDefinitionModelA = new LayerDefinitionModel({
      id: 'l1',
      options: {
        type: 'CartoDB',
        name: 'Layer A',
        table_name: 'districts',
        letter: 'a'
      }
    }, {
      parse: true,
      configModel: {}
    });
  });

  beforeEach(function () {
    this.view = new SourceLayerAnalysisView({
      model: this.sourceAnalysisDefinitionNodeModel,
      layerDefinitionModel: this.layerDefinitionModelA
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('a0');
    expect(this.view.$el.text()).toContain('districts');
  });

  describe('draggable helper', function () {
    it('should add a helper by default', function () {
      var view = new SourceLayerAnalysisView({
        model: this.sourceAnalysisDefinitionNodeModel,
        layerDefinitionModel: this.layerDefinitionModelA
      });
      view.render();
      expect(view.draggableHelperView).toBeDefined();
    });
    it('should allow to avoid adding a helper', function () {
      var view = new SourceLayerAnalysisView({
        model: this.sourceAnalysisDefinitionNodeModel,
        layerDefinitionModel: this.layerDefinitionModelA,
        isDraggable: false
      });
      view.render();
      expect(view.draggableHelperView).not.toBeDefined();
    });
  });
});
