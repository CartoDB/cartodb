var cdb = require('cartodb.js');
var _ = require('underscore');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var AnalysesWorkflowView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-workflow-view');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layer = new LayerDefinitionModel({
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
      configModel: this.configModel
    });

    this.a0 = new AnalysisDefinitionNodeModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: this.configModel,
      collection: new cdb.Backbone.Collection()
    });
    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'buffer'
    }, {
      configModel: this.configModel,
      collection: new cdb.Backbone.Collection()
    });

    spyOn(this.a1, 'getPrimarySource').and.returnValue(this.a0);
    spyOn(this.layer, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a1);

    this._addNewAnalysis = function (newNodeId) {
      var newNodeDefModel = this[newNodeId] = new AnalysisDefinitionNodeModel({
        id: newNodeId,
        type: 'buffer',
        range: '100'
      }, {
        configModel: this.configModel,
        collection: new cdb.Backbone.Collection()
      });
      spyOn(newNodeDefModel, 'getPrimarySource').and.returnValue(this.layer.getAnalysisDefinitionNodeModel());
      this.layer.getAnalysisDefinitionNodeModel.and.returnValue(newNodeDefModel);
      this.layer.set('source', newNodeId);
    };

    this.viewModel = new cdb.core.Model({
      selectedNode: this.a1
    });

    this.openAddAnalysisSpy = jasmine.createSpy('openAddAnalysis');

    var analysisNode = new cdb.core.Model({
      status: 'ready'
    });
    var analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    analysis.findNodeById.and.returnValue(analysisNode);

    this.view = new AnalysesWorkflowView({
      analysis: analysis,
      layerDefinitionModel: this.layer,
      openAddAnalysis: this.openAddAnalysisSpy,
      viewModel: this.viewModel
    });
    this.view.render();
  });

  describe('.render', function () {
    it('should display add button and the list of analysis', function () {
      expect(this.view.$('.js-add-analysis').length).toBe(1);
      expect(this.view.$('.js-list').length).toBe(1);
      expect(this.view.$('.js-delete').length).toBe(1);
    });

    it('should render all nodes except for the source', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.js-list > li').length).toBe(2);
      expect(this.view.$('.js-list li:eq(0) .js-add-analysis').length).toBe(1);
      expect(this.view.$('.js-list li:eq(1)').text()).toContain('a1');
    });

    it('should update when selectedNode changes', function () {
      this._addNewAnalysis('a3');

      this.viewModel.set('selectedNode', this.a3);
      expect(this.view.$('.js-list > li').length).toBe(3);
      expect(this.view.$('.js-list li:eq(1)').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.js-list li:eq(1)').text()).toContain('a3');

      this.viewModel.set('selectedNode', this.a1);
      expect(this.view.$('.js-list > li').length).toBe(3);
      expect(this.view.$('.js-list li:eq(2)').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.js-list li:eq(2)').text()).toContain('a1');
    });
  });

  it('should change selectedNode when a different node is clicked', function () {
    this._addNewAnalysis('a2');
    this.view.render();

    this.view.$('.js-list li:eq(1)').click();
    expect(this.viewModel.get('selectedNode')).toBe(this.a2);
    expect(this.view.$('.js-list li:eq(1)').hasClass('is-selected')).toBeTruthy();
    expect(this.view.$('.js-list li:eq(1)').text()).toContain('a2');
    expect(this.view.$('.js-list li:eq(2)').hasClass('is-selected')).toBeFalsy();
    expect(this.view.$('.js-list li:eq(2)').text()).toContain('a1');

    this.view.$('.js-list li:eq(2)').click();
    expect(this.viewModel.get('selectedNode')).toBe(this.a1);
    expect(this.view.$('.js-list li:eq(1)').hasClass('is-selected')).toBeFalsy();
    expect(this.view.$('.js-list li:eq(2)').hasClass('is-selected')).toBeTruthy();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when click add-analysis', function () {
    beforeEach(function () {
      this.view.$('.js-add-analysis').click();
    });

    it('should open modal to add analysis', function () {
      expect(this.openAddAnalysisSpy).toHaveBeenCalled();
    });
  });
});
