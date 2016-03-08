var Backbone = require('backbone');
var LayerAnalysisViewFactory = require('../../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var LayerAnalysisSourceView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/layer-analysis-source-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisSourceModel = require('../../../../../../javascripts/cartodb3/data/analysis-definitions/analysis-source-definition-model');

describe('editor/layers/analysis-views/layer-analysis-source-view', function () {
  beforeEach(function () {
    this.analysisDefinitionModel = new AnalysisSourceModel({
      id: 'a0',
      table_name: 'districts'
    }, {
      configModel: {}
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l1',
      letter: 'a',
      kind: 'cartodb',
      name: 'Layer A',
      table_name: 'districts'
    }, {
      configModel: {}
    });

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory({});
  });

  describe('a layer with its own source analysis', function () {
    beforeEach(function () {
      this.view = new LayerAnalysisSourceView({
        model: this.analysisDefinitionModel,
        layerDefinitionModel: this.layerDefinitionModel,
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
      this.layerDefinitionModel2 = new LayerDefinitionModel({
        id: 'l2',
        letter: 'b',
        kind: 'cartodb',
        table_name: 'districts'
      }, {
        configModel: {},
        collection: new Backbone.Collection([this.layerDefinitionModel])
      });

      this.view = new LayerAnalysisSourceView({
        model: this.analysisDefinitionModel,
        layerDefinitionModel: this.layerDefinitionModel2,
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });

      this.view.render();
    });

    it('should render correctly', function () {
      expect(this.view.$el.text()).toContain('a Layer A');
    });
  });
});
