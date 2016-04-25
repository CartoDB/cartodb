var cdb = require('cartodb.js');
var _ = require('underscore');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysesWorkflowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-workflow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var createDefaultVis = require('../../../create-default-vis');

describe('editor/layers/layer-content-view/analyses-workflow-view', function () {
  var analysisDefinitionsCollection;
  var layer;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var vis = createDefaultVis();

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: configModel,
      analysisCollection: []
    });

    analysisDefinitionsCollection = this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection([
      {
        id: 'xyz123',
        analysis_definition: {
          id: 'a1',
          type: 'trade-area',
          params: {
            kind: 'walk',
            time: '100',
            source: {
              id: 'a0',
              type: 'source',
              table_name: 'foo',
              params: {
                query: 'SELECT * FROM foo'
              }
            }
          }
        }
      }
    ], {
      configModel: configModel,
      analysis: vis.analysis,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      vizId: 'v-123'
    });

    layer = this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a1',
        letter: 'a'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    this.viewModel = new cdb.core.Model({
      selectedNodeId: 'a1'
    });

    this.openAddAnalysisSpy = jasmine.createSpy('openAddAnalysis');

    this.view = new AnalysesWorkflowView({
      layerDefinitionModel: this.layer,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
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

    it('should render as many nodes as the layer has, not taking into account the source', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.js-list > li').length).toBe(2);
      expect(this.view.$('.js-list li:eq(0) .js-add-analysis').length).toBe(1);
      expect(this.view.$('.js-list li:eq(1)').text()).toContain('a1');
    });

    it('should render when selectedNodeId changes', function () {
      addNewAnalysis('a3', this.analysisDefinitionNodesCollection.get('a1'));
      this.viewModel.set('selectedNodeId', 'a3');
      expect(this.view.$('.js-list > li').length).toBe(3);
      expect(this.view.$('.js-list li:eq(1)').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.js-list li:eq(1)').text()).toContain('a3');
      this.viewModel.set('selectedNodeId', 'a1');
      expect(this.view.$('.js-list > li').length).toBe(3);
      expect(this.view.$('.js-list li:eq(2)').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.js-list li:eq(2)').text()).toContain('a1');
    });
  });

  it('should change selectedNodeId when a different node is clicked', function () {
    addNewAnalysis('a2', this.analysisDefinitionNodesCollection.get('a1'));
    this.view.render();
    this.view.$('.js-list li:eq(1)').click();
    expect(this.viewModel.get('selectedNodeId')).toBe('a2');
    expect(this.view.$('.js-list li:eq(1)').hasClass('is-selected')).toBeTruthy();
    expect(this.view.$('.js-list li:eq(1)').text()).toContain('a2');
    expect(this.view.$('.js-list li:eq(2)').hasClass('is-selected')).toBeFalsy();
    expect(this.view.$('.js-list li:eq(2)').text()).toContain('a1');
    this.view.$('.js-list li:eq(2)').click();
    expect(this.viewModel.get('selectedNodeId')).toBe('a1');
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

  function addNewAnalysis (newNodeId, source) {
    analysisDefinitionsCollection.add({
      id: 'xyz1234',
      analysis_definition: {
        id: newNodeId,
        type: 'buffer',
        params: {
          range: '100',
          source: source.toJSON()
        }
      }
    });
    layer.set('source', newNodeId);
  }
});
