var Backbone = require('backbone');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysesWorkflowView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-workflow-view');
var AnalysisDefinitionNodesCollection = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
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

    this.viewModel = new Backbone.Model({
      selectedNodeId: 'a2'
    });

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a2',
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });
    spyOn(this.nodeDefModel, 'canBeDeletedByUser').and.returnValue(true);

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
    spyOn(this.analysisFormsCollection, 'deleteNode');

    this.view = new AnalysesWorkflowView({
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisFormsCollection: this.analysisFormsCollection,
      viewModel: this.viewModel,
      layerDefinitionModel: this.layerDefModel
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when click delete-analysis', function () {
    beforeEach(function () {
      this.view.$('.js-delete').click();
    });

    it('should remove new node', function () {
      expect(this.analysisFormsCollection.deleteNode).toHaveBeenCalled();
    });
  });

  describe('when can delete', function () {
    beforeEach(function () {
      this.layerDefModel.findAnalysisDefinitionNodeModel.and.returnValue(this.nodeDefModel);
      this.view.render();
    });

    it('should render deletion if can delete', function () {
      expect(this.view.$el.html()).toContain('js-delete');
    });

    describe('when click delete-analysis', function () {
      beforeEach(function () {
        this.view.$('.js-delete').click();
      });

      it('should delete selectednode', function () {
        expect(this.analysisFormsCollection.deleteNode).toHaveBeenCalledWith('a2');
      });
    });
  });
});
