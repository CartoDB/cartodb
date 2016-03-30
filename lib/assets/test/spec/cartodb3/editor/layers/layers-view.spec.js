var ModalsServiceModel = require('../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayersView = require('../../../../../javascripts/cartodb3/editor/layers/layers-view');
var createDefaultVis = require('../../create-default-vis');

describe('editor/layers/layers-view', function () {
  beforeEach(function () {
    var vis = createDefaultVis();
    this.stackLayoutModel = new StackLayoutModel(null, {
      stackLayoutItems: []
    });
    this.modals = new ModalsServiceModel();
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {}
    });

    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: {},
      analysis: {},
      vizId: 'viz-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
    });
    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      visMap: vis.map
    });
    this.layerDefinitionsCollection.add({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'foo_bar',
        cartocss: ''
      }
    });

    this.view = new LayersView({
      stackLayoutModel: this.stackLayoutModel,
      modals: this.modals,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('._onNodeCreated', function () {
    describe('when new nodeModel is invalid', function () {
      beforeEach(function () {
        spyOn(this.stackLayoutModel, 'nextStep');
        this.nodeModel = this.analysisDefinitionNodesCollection.add({
          id: 'a1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          params: {
            points_source: {
              id: 'a0',
              type: 'source',
              table_name: 'points',
              params: {
                query: 'SELECT * FROM points'
              }
            },
            polygons_source: {
              id: 'b0',
              type: 'source',
              // should be invalid due to missing query and/or table_name
              params: {}
            }
          }
        }, {silent: true});

        this.view._onNodeCreated(this.layerDefinitionsCollection.first(), this.nodeModel);
      });

      it('should change stack layout to edit new analysis', function () {
        expect(this.stackLayoutModel.nextStep).toHaveBeenCalled();
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[0]).toBe(this.layerDefinitionsCollection.first());
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[1]).toEqual('layers');
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[2]).toEqual('a1');
      });
    });
  });
});
