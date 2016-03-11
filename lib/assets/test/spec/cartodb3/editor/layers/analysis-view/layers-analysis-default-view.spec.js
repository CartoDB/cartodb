var cdb = require('cartodb.js');
var LayerAnalysisViewFactory = require('../../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var LayerAnalysisDefaultView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/layer-analysis-default-view');
var AnalysisDefinitionCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');

describe('editor/layers/analysis-views/layer-analysis-default-view', function () {
  beforeEach(function () {
    this.analysisDefinitionCollection = new AnalysisDefinitionCollection(null, {
      configModel: {},
      vizId: 'v-123'
    });

    this.analysisDefinitionCollection.createNodeModel({
      id: 'a3',
      type: 'trade-area',
      params: {
        kind: 'walk',
        time: 300,
        source: {
          id: 'a2',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        }
      }
    });
    var model = this.analysisDefinitionCollection.getNodeModel('a3');

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory(this.analysisDefinitionCollection);
    this.sourceView = new cdb.core.View();
    this.sourceView.render = function () {
      this.$el.html('thesource');
      return this;
    };
    spyOn(this.layerAnalysisViewFactory, 'createView').and.returnValue(this.sourceView);

    this.layerDefinitionModel = new LayerDefinitionModel({
      table_name: 'districts'
    }, {
      configModel: {},
      parse: true
    });

    this.view = new LayerAnalysisDefaultView({
      model: model,
      layerDefinitionModel: this.layerDefinitionModel,
      layerAnalysisViewFactory: this.layerAnalysisViewFactory
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

  it('should render source view as next node', function () {
    expect(this.view.$el.text()).toContain('thesource');
    expect(this.layerAnalysisViewFactory.createView.calls.argsFor(0)[0]).toEqual('a2');
    expect(this.layerAnalysisViewFactory.createView.calls.argsFor(0)[1]).toBe(this.layerDefinitionModel);
  });
});
