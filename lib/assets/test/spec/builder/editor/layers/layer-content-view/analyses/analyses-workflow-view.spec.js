var Backbone = require('backbone');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var AnalysisFormsCollection = require('builder/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysesWorkflowView = require('builder/editor/layers/layer-content-views/analyses/analyses-workflow-view');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {},
      userModel: {}
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'source',
      status: 'ready'
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a2',
      type: 'source',
      status: 'ready'
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a3',
      type: 'source',
      status: 'ready'
    });

    this.layerDefModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a1',
        letter: 'a'
      }
    }, {
      parse: true,
      collection: new Backbone.Collection(),
      configModel: {}
    });
    spyOn(this.layerDefModel, 'getAnalysisDefinitionNodeModel');
    spyOn(this.layerDefModel, 'findAnalysisDefinitionNodeModel');
    spyOn(this.layerDefModel, 'canBeGeoreferenced').and.returnValue(false);

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a2',
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });

    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      configModel: {},
      userActions: {},
      layerDefinitionModel: this.layerDefModel,
      analysisSourceOptionsModel: {}
    });
    this.analysisFormsCollection.add([
      {id: 'a3'},
      {id: 'a2'},
      {id: 'a1'}
    ]);

    this.view = new AnalysesWorkflowView({
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisFormsCollection: this.analysisFormsCollection,
      selectedNodeId: 'a2',
      layerDefinitionModel: this.layerDefModel
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render when analysis node is added', function () {
    spyOn(this.view, 'render').and.callThrough();

    this.analysisDefinitionNodesCollection.add({
      id: 'a5',
      type: 'source',
      status: 'ready'
    });

    expect(this.view.render).not.toHaveBeenCalled();

    // A change in the source should trigger the render
    this.layerDefModel.set({ source: 'a5' });
    expect(this.view.render).toHaveBeenCalled();

    // But another change in the source without adding a node should not
    this.layerDefModel.set({ source: 'a4' });
    expect(this.view.render.calls.count()).toBe(1);
  });
});
