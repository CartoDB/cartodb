var Backbone = require('backbone');
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

    this.viewModel = new Backbone.Model({
      selectedNodeId: 'a2'
    });

    var analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    analysis.findNodeById.and.callFake(function (id) {
      return new Backbone.Model({
        id: id,
        status: 'ready'
      });
    });

    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
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
      layerId: this.layerDefModel.id
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should display the delete button', function () {
    expect(this.view.$('.js-delete').length).toBe(1);
  });

  describe('when click delete-analysis', function () {
    beforeEach(function () {
      this.view.$('.js-delete').click();
    });

    it('should delete selectednode', function () {
      expect(this.analysisFormsCollection.deleteNode).toHaveBeenCalled();
      expect(this.analysisFormsCollection.deleteNode).toHaveBeenCalledWith('a2');
    });
  });
});
