var Backbone = require('backbone');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysesWorkflowView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-workflow-view');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-view', function () {
  beforeEach(function () {
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

    var analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    analysis.findNodeById.and.callFake(function (id) {
      return new Backbone.Model({
        id: id,
        status: 'ready'
      });
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
    spyOn(this.analysisFormsCollection, 'deleteNode');

    this.view = new AnalysesWorkflowView({
      analysis: analysis,
      analysisFormsCollection: this.analysisFormsCollection,
      viewModel: this.viewModel,
      layerDefinitionModel: this.layerDefModel
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should not display the delete button if can not delete', function () {
    expect(this.view.$el.html()).not.toContain('js-delete');
  });

  describe('when click delete-analysis', function () {
    beforeEach(function () {
      this.view.$('.js-delete').click();
    });

    it('should not delete node', function () {
      expect(this.analysisFormsCollection.deleteNode).not.toHaveBeenCalled();
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

      it('should delete selectednode if can delete', function () {
        expect(this.analysisFormsCollection.deleteNode).toHaveBeenCalledWith('a2');
      });
    });
  });
});
