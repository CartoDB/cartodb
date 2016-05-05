var _ = require('underscore');
var cdb = require('cartodb.js');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysesView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var createDefaultVis = require('../../../create-default-vis');
var ModalsService = require('../../../../../../javascripts/cartodb3/components/modals/modals-service-model');

describe('editor/layers/layer-content-view/analyses-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var vis = createDefaultVis();

    this.sqlAPI = new cdb.SQL({
      user: 'pepe'
    });
    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: this.sqlAPI,
      configModel: configModel,
      vis: vis
    });
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      analysis: vis.analysis,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      vizId: 'v-123'
    });
    this.analysisDefinitionsCollection.add({
      id: 'hello',
      analysis_definition: {
        id: 'a0',
        type: 'source',
        table_name: 'foo',
        params: {
          query: 'SELECT * FROM foo'
        }
      }
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      visMap: vis.map,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });
    this.layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    });

    this.modals = new ModalsService();

    this.view = new AnalysesView({
      layerDefinitionModel: this.layerDefinitionModel,
      modals: this.modals,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection
    });
    this.view.render();
  });

  describe('render', function () {
    describe('if there is no analyses', function () {
      it('should render placeholder view', function () {
        expect(this.view.$('.js-new-analysis').length).toBe(1);
      });

      it('should not render other view', function () {
        expect(_.size(this.view._subviews)).toBe(0);
      });

      describe('when click new-analysis', function () {
        beforeEach(function () {
          spyOn(this.modals, 'create').and.callThrough();
          this.view.$('.js-new-analysis').click();
        });

        afterEach(function () {
          this.modals.destroy();
        });

        it('should open modal to add analysis', function () {
          expect(this.modals.create).toHaveBeenCalled();
        });
      });
    });

    describe('if there is any analysis', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.add({
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
        });
        this.layerDefinitionModel.set('source', 'a1');
      });

      it('should render workflow and analysis form views', function () {
        expect(_.size(this.view._subviews)).toBe(2);
        expect(this.view.$('.js-new-analysis').length).toBe(0);
      });
    });
  });

  it('should change selected node when layer definition source changes', function () {
    spyOn(this.view, 'render');
    expect(this.view.viewModel.get('selectedNodeId')).toBe('a0');
    this.analysisDefinitionsCollection.add({
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
    });
    this.layerDefinitionModel.set('source', 'a1');
    expect(this.view.viewModel.get('selectedNodeId')).toBe('a1');
    expect(this.view.render).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
