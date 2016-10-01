var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerAnalysesView = require('../../../../../javascripts/cartodb3/editor/layers/layer-analyses-view');
var LayerAnalysisViewFactory = require('../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');

describe('editor/layers/layer-analyses-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });
    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });

    var analysisNode = new Backbone.Model({
      status: 'ready'
    });

    var analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    analysis.findNodeById.and.returnValue(analysisNode);

    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory(this.analysisDefinitionNodesCollection, analysis);
  });

  describe('given a layer definition with only its own source', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.add({
        id: 'l1',
        kind: 'carto',
        options: {
          table_name: 'own_source',
          cartocss: 'asd'
        }
      });

      this.view = new LayerAnalysesView({
        model: this.layerDefinitionsCollection.get('l1'),
        sortableSelector: '.js-layers',
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });

      this.view.render();
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render the source', function () {
      expect(this.view.$el.text()).toContain('a0');
      expect(this.view.$el.text()).toContain('own_source');
    });
  });

  describe('given a layer definition with an analysis within its own layer', function () {
    beforeEach(function () {
      this.analysisDefinitionNodesCollection.add({
        id: 'b1',
        type: 'trade-area',
        params: {
          kind: 'walk',
          time: 300,
          source: {
            id: 'b0',
            type: 'source',
            table_name: 'foo',
            params: {
              query: 'SELECT * FROM foo'
            }
          }
        }
      });
      this.layerDefinitionsCollection.add({
        id: 'l1',
        kind: 'carto',
        options: {
          table_name: 'foo',
          cartocss: 'asd',
          letter: 'b',
          source: 'b1',
          name: 'layerB'
        }
      });
      this.view = new LayerAnalysesView({
        model: this.layerDefinitionsCollection.get('l1'),
        sortableSelector: '.js-layers',
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });

      this.view.render();
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render the sources', function () {
      expect(this.view.$el.text()).toContain('b1');
      expect(this.view.$el.text()).toContain('analyses.area-of-influence');
      expect(this.view.$el.text()).toContain('b0');
      expect(this.view.$el.text()).toContain('foo');
    });

    describe('given a layer definition with an analysis referencing the head of other layer', function () {
      beforeEach(function () {
        this.analysisDefinitionNodesCollection.add({
          id: 'c1',
          type: 'trade-area',
          params: {
            kind: 'walk',
            time: 200,
            source: this.analysisDefinitionNodesCollection.get('b1').toJSON()
          }
        });
        this.layerDefinitionsCollection.add({
          id: 'l2',
          kind: 'carto',
          options: {
            table_name: 'foo',
            cartocss: 'asd',
            letter: 'c',
            source: 'c1',
            name: 'layerC'
          }
        });
        this.view = new LayerAnalysesView({
          model: this.layerDefinitionsCollection.get('l2'),
          sortableSelector: '.js-layers',
          layerAnalysisViewFactory: this.layerAnalysisViewFactory
        });

        this.view.render();
      });

      it('should have no leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });

      it('should render the own source node', function () {
        expect(this.view.$el.text()).toContain('c1');
        expect(this.view.$el.text()).toContain('analyses.area-of-influence');
      });

      it('should render the source of the other layer but not more', function () {
        expect(this.view.$el.text()).toContain('b1');
        expect(this.view.$el.text()).not.toContain('b0');
      });
    });
  });
});
