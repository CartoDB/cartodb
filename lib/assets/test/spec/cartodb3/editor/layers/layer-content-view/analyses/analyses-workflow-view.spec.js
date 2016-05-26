var cdb = require('cartodb.js');
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
      collection: new cdb.Backbone.Collection(),
      configModel: {}
    });
    spyOn(this.layerDefModel, 'getAnalysisDefinitionNodeModel');

    this.viewModel = new cdb.core.Model({
      selectedNodeId: 'a2'
    });

    this.openAddAnalysisSpy = jasmine.createSpy('openAddAnalysis');

    var analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    analysis.findNodeById.and.callFake(function (id) {
      return new cdb.core.Model({
        id: id,
        status: 'ready'
      });
    });

    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
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
      openAddAnalysis: this.openAddAnalysisSpy,
      viewModel: this.viewModel
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should display add button and the list of analysis', function () {
    expect(this.view.$('.js-add-analysis').length).toBe(1);
  });

  it('should display the delete button', function () {
    expect(this.view.$('.js-delete').length).toBe(1);
  });

  it('should render an item per node', function () {
    expect(this.view.$el.html()).toContain('a3');
    expect(this.view.$el.html()).toContain('a2');
    expect(this.view.$el.html()).toContain('a1');
  });

  it('should highlight selected node', function () {
    expect(this.view.$('.is-selected').length).toEqual(1);
    expect(this.view.$('.js-list li:eq(2)').hasClass('is-selected')).toBeTruthy();
    expect(this.view.$('.js-list li:eq(2)').text()).toContain('a2');
  });

  describe('when another non-selected node is clicked', function () {
    beforeEach(function () {
      this.view.$('.js-list li:eq(3)').click();
    });

    it('should change selected workflow item', function () {
      expect(this.viewModel.get('selectedNodeId')).toEqual('a1');
    });

    it('should only have one item selected still', function () {
      expect(this.view.$('.is-selected').length).toEqual(1);
    });
  });

  describe('when click add-analysis', function () {
    beforeEach(function () {
      this.view.$('.js-add-analysis').click();
    });

    it('should open modal to add analysis', function () {
      expect(this.openAddAnalysisSpy).toHaveBeenCalled();
    });
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
