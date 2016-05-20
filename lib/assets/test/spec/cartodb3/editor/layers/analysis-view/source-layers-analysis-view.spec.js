var SourceLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/source-layer-analysis-view');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('editor/layers/analysis-views/source-layer-analysis-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([{
      id: 'a0',
      type: 'source',
      table_name: 'foo_bar',
      params: {
        query: 'SELECT * FROM foo_bar'
      }
    }], {
      configModel: {}
    });
    this.sourceAnalysisDefinitionNodeModel = this.analysisDefinitionNodesCollection.get('a0');
  });

  beforeEach(function () {
    this.view = new SourceLayerAnalysisView({
      model: this.sourceAnalysisDefinitionNodeModel
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('a0');
    expect(this.view.$el.text()).toContain('foo_bar');
  });

  describe('draggable helper', function () {
    it('should add a helper by default', function () {
      var view = new SourceLayerAnalysisView({
        model: this.sourceAnalysisDefinitionNodeModel
      });
      view.render();
      expect(view.draggableHelperView).toBeDefined();
    });
    it('should allow to avoid adding a helper', function () {
      var view = new SourceLayerAnalysisView({
        model: this.sourceAnalysisDefinitionNodeModel,
        isDraggable: false
      });
      view.render();
      expect(view.draggableHelperView).not.toBeDefined();
    });
  });
});
