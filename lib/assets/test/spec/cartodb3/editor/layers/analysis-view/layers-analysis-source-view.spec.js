var Backbone = require('backbone');
var LayerAnalysisViewFactory = require('../../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var LayerAnalysisSourceView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/layer-analysis-source-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('editor/layers/analysis-views/layer-analysis-source-view', function () {
  beforeEach(function () {
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection();
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([{
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM foo'
      }
    }]);
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

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory({});
  });

  describe('a layer with its own source analysis', function () {
    beforeEach(function () {
      this.view = new LayerAnalysisSourceView({
        model: this.sourceAnalysisDefinitionNodeModel,
        layerDefinitionModel: this.layerDefinitionModelA,
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });

      this.view.render();
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render correctly', function () {
      expect(this.view.$el.text()).toContain('a0 districts');
    });
  });

  describe('a layer with a referenced source analysis', function () {
    beforeEach(function () {
      this.layerDefinitionModelB = new LayerDefinitionModel({
        id: 'l2',
        options: {
          letter: 'b',
          type: 'CartoDB',
          table_name: 'districts'
        }
      }, {
        parse: true,
        configModel: {},
        collection: new Backbone.Collection([this.layerDefinitionModelA])
      });

      this.view = new LayerAnalysisSourceView({
        model: this.sourceAnalysisDefinitionNodeModel,
        layerDefinitionModel: this.layerDefinitionModelB,
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });

      this.view.render();
    });

    it('should render correctly', function () {
      expect(this.view.$el.text()).toContain('a Layer A');
    });
  });
});
