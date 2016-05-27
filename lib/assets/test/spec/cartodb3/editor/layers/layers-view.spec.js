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

  describe('._onAddAnalysisModalClosed', function () {
    beforeEach(function () {
      spyOn(this.stackLayoutModel, 'nextStep');
    });

    describe('when a new analysis is added', function () {
      beforeEach(function () {
        var nodeAttrs = {
          id: 'a1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          polygons_source: 'a0'
        };
        this.view._onAddAnalysisModalClosed(this.layerDefinitionsCollection.first(), nodeAttrs);
      });

      it('should change stack layout to edit new analysis', function () {
        expect(this.stackLayoutModel.nextStep).toHaveBeenCalled();
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[0]).toBe(this.layerDefinitionsCollection.first());
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[1]).toEqual('layer-content');
        expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[2]).toEqual({
          id: 'a1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          polygons_source: 'a0'
        });
      });
    });

    describe('when modal is closed with adding a new analysis', function () {
      beforeEach(function () {
        this.view._onAddAnalysisModalClosed(this.layerDefinitionsCollection.first(), null);
      });

      it('should not change current stack view', function () {
        expect(this.stackLayoutModel.nextStep).not.toHaveBeenCalled();
      });
    });
  });
});
