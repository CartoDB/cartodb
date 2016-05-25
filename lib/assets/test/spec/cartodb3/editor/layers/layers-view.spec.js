var ModalsServiceModel = require('../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayersView = require('../../../../../javascripts/cartodb3/editor/layers/layers-view');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/layers-view', function () {
  beforeEach(function () {
    this.stackLayoutModel = new StackLayoutModel(null, {
      stackLayoutItems: []
    });
    this.modals = new ModalsServiceModel();
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
    this.layerDefinitionsCollection.add({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'foo_bar',
        cartocss: ''
      }
    });

    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);

    this.view = new LayersView({
      configModel: {},
      userModel: {},
      editorModel: new EditorModel(),
      analysis: this.analysis,
      modals: this.modals,
      stackLayoutModel: this.stackLayoutModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
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
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[2].id).toEqual('a1');
      });
    });
  });
});
