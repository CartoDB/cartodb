var Backbone = require('backbone');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var RefLayerAnalysisView = require('builder/editor/layers/analysis-views/ref-layer-analysis-view');

describe('editor/layers/analysis-views/ref-layer-analysis-view', function () {
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

    this.analysisNode = new Backbone.Model();
    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'layerA',
      kind: 'carto',
      options: {
        table_name: 'alice'
      }
    }, {
      configModel: {}
    });
    spyOn(this.layerDefinitionModel, 'getName').and.returnValue('layer-name');

    this.view = new RefLayerAnalysisView({
      model: this.model,
      analysisNode: this.analysisNode,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title', function () {
    expect(this.view.$el.text()).toContain('analyses.area-of-influence');
    expect(this.view.$el.text()).toContain('layer-name');
  });

  it('should render the loading until ready', function () {
    expect(this.view.$el.html()).toContain('Loader');
    expect(this.view.$el.text()).not.toContain('a3');
  });

  it('should render the data-attrs and js hook to edit analysis', function () {
    expect(this.view.el.className).toContain('js-analysis-node');
    expect(this.view.el.dataset.analysisNodeId).toEqual('a3');
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
});
