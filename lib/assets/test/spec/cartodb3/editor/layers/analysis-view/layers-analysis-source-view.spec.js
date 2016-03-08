var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerAnalysisViewFactory = require('../../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var LayerAnalysisSourceView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/layer-analysis-source-view');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/layers/analysis-views/layer-analysis-source-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection([], {
      configModel: configModel
    });

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory(this.analysisDefinitionsCollection);

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      configModel: configModel,
      layersCollection: new Backbone.Collection([]),
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      mapId: 'map-123'
    });

    this.layerDefinitionsCollection.add({
      id: 'l0',
      kind: 'tiled'
    });

    this.layerDefinitionsCollection.add({
      id: 'l1',
      kind: 'cartodb',
      options: {
        table_name: 'districts'
      }
    });

    this.layerDefinitionsCollection.add({
      id: 'l2',
      kind: 'cartodb',
      options: {
        table_name: 'foobar'
      }
    });
  });

  describe('a layer with its own source analysis', function () {
    beforeEach(function () {
      this.view = new LayerAnalysisSourceView({
        model: this.analysisDefinitionsCollection.at(0),
        layerDefinitionModel: this.layerDefinitionsCollection.at(1),
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
      this.view = new LayerAnalysisSourceView({
        model: this.analysisDefinitionsCollection.at(0),
        layerDefinitionModel: this.layerDefinitionsCollection.at(2),
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });
      this.view.render();
    });

    it('should render correctly', function () {
      expect(this.view.$el.text()).toContain('a districts');
    });
  });
});
