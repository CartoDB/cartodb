var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysesWorkflowListView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-workflow-list-view');
var AnalysisDefinitionNodesCollection = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-list-view', function () {
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

    this.viewModel = new Backbone.Model({
      selectedNodeId: 'a2'
    });

    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      configModel: {},
      userModel: {},
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

    this.view = new AnalysesWorkflowListView({
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisFormsCollection: this.analysisFormsCollection,
      model: this.viewModel,
      layerId: this.layerDefModel.id
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should display add button and the list of analysis', function () {
    expect(this.view.$('.js-add-analysis').length).toBe(1);
    expect(this.view.$('.js-add-analysis').data('layer-id')).toEqual('l-1');
  });

  it('should render an item per node', function () {
    expect(this.view.$el.html()).toContain('a3');
    expect(this.view.$el.html()).toContain('a2');
    expect(this.view.$el.html()).toContain('a1');
  });

  it('should highlight selected node', function () {
    expect(this.view.$('.is-selected').length).toEqual(1);
    expect(this.view.$('li:eq(2)').hasClass('is-selected')).toBeTruthy();
    expect(this.view.$('li:eq(2)').text()).toContain('a2');
  });

  describe('when another non-selected node is clicked', function () {
    beforeEach(function () {
      this.view.$('li:eq(3)').click();
    });

    it('should change selected workflow item', function () {
      expect(this.viewModel.get('selectedNodeId')).toEqual('a1');
    });

    it('should only have one item selected still', function () {
      expect(this.view.$('.is-selected').length).toEqual(1);
    });
  });
});
