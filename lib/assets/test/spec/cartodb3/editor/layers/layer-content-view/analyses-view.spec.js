var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysesView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/layer-content-view/analyses-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    this.analysisDefinitonsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      vizId: 'v-123'
    });

    this.analysisDefinitonsCollection.add({
      id: 'hello',
      analysis_definition: {
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo'
        }
      }
    });

    this.view = new AnalysesView({
      layerDefinitionModel: this.layer,
      analysisDefinitonsCollection: this.analysisDefinitonsCollection
    });
    this.view.render();
  });

  describe('render', function () {
    describe('if there is no analyses', function () {
      it('should render placeholder view', function () {
        expect(this.view.$('.js-addAnalysis').length).toBe(1);
      });
      it('should not render other view', function () {
        expect(_.size(this.view._subviews)).toBe(0);
      });
    });

    describe('if there is any analysis', function () {
      beforeEach(function () {
        this.layer.set('source', 'a1');
        this.analysisDefinitonsCollection.add({
          id: 'xyz123',
          analysis_definition: {
            id: 'a1',
            type: 'trade-area',
            params: {
              kind: 'walk',
              time: '100'
            }
          }
        });
      });

      it('should render workflow and analysis form views', function () {
        expect(_.size(this.view._subviews)).toBe(2);
        expect(this.view.$('.js-addAnalysis').length).toBe(0);
      });
    });
  });

  it('should change selected node when a new analysis is added or removed', function () {
    spyOn(this.view, 'render');
    expect(this.view.viewModel.get('selectedNodeId')).toBe('a0');
    this.analysisDefinitonsCollection.add({
      id: 'xyz123',
      analysis_definition: {
        id: 'a1',
        type: 'trade-area',
        params: {
          kind: 'walk',
          time: '100'
        }
      }
    });
    expect(this.view.viewModel.get('selectedNodeId')).toBe('a1');
    expect(this.view.render).toHaveBeenCalled();
    expect(this.view.render.calls.count()).toBe(1);
    this.analysisDefinitonsCollection.remove(this.analysisDefinitonsCollection.at(1));
    expect(this.view.render).toHaveBeenCalled();
    expect(this.view.render.calls.count()).toBe(2);
    expect(this.view.viewModel.get('selectedNodeId')).toBe('a0');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
