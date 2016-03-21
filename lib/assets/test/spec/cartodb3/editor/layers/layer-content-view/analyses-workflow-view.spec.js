var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysesWorkflowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-workflow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/layer-content-view/analyses-workflow-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitonsCollection = new AnalysisDefinitionsCollection([
      {
        id: 'hello',
        analysis_definition: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        }
      },{
        id: 'xyz123',
        analysis_definition: {
          id: 'a1',
          type: 'trade-area',
          params: {
            kind: 'walk',
            time: '100'
          }
        }
      }
    ], {
      configModel: configModel,
      vizId: 'v-123'
    });

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a1'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    this.viewModel = new cdb.core.Model({
      selectedNodeId: 'a1'
    });

    this.view = new AnalysesWorkflowView({
      layerDefinitionModel: this.layer,
      analysisDefinitonsCollection: this.analysisDefinitonsCollection,
      viewModel: this.viewModel
    });
    this.view.render();
  });

  describe('.render', function () {
    it('should display add button and the list of analysis', function () {
      expect(this.view.$('.js-newAnalysis').length).toBe(1);
      expect(this.view.$('.js-list').length).toBe(1);
      expect(this.view.$('.js-delete').length).toBe(1);
    });

    it('should render as many nodes as the layer has, not taking into account the source', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.js-list > li').length).toBe(2);
      expect(this.view.$('.js-list li:eq(1)').text()).toBe('a0');

    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
