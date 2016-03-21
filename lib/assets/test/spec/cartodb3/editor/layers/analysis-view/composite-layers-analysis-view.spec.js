var cdb = require('cartodb.js');
var LayerAnalysisViewFactory = require('../../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var CompositeLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/composite-layer-analysis-view');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');

describe('editor/layers/analysis-views/composite-layer-analysis-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();

    this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'point-in-polygon',
      params: {
        points_source: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        },
        polygons_source: {
          id: 'b0',
          type: 'source',
          params: {
            query: 'SELECT * FROM bar'
          }
        }
      }
    });
    var model = this.analysisDefinitionNodesCollection.get('a1');

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory(this.analysisDefinitionNodesCollection);
    spyOn(this.layerAnalysisViewFactory, 'createView').and.callFake(function (sourceId) {
      var sourceView = new cdb.core.View();
      sourceView.render = function () {
        this.$el.html(sourceId);
        return this;
      };
      return sourceView;
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      options: {
        type: 'CartoDB',
        table_name: 'districts'
      }
    }, {
      configModel: {},
      parse: true
    });

    this.view = new CompositeLayerAnalysisView({
      model: model,
      layerDefinitionModel: this.layerDefinitionModel,
      layerAnalysisViewFactory: this.layerAnalysisViewFactory
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the two sources as separate views', function () {
    expect(this.view.$el.text()).toContain('a0');
    expect(this.view.$el.text()).toContain('b0');

    expect(this.layerAnalysisViewFactory.createView.calls.argsFor(0)[0]).toEqual('a0');
    expect(this.layerAnalysisViewFactory.createView.calls.argsFor(0)[1]).toBe(this.layerDefinitionModel);
    expect(this.layerAnalysisViewFactory.createView.calls.argsFor(1)[0]).toEqual('b0');
    expect(this.layerAnalysisViewFactory.createView.calls.argsFor(1)[1]).toBe(this.layerDefinitionModel);
  });
});
