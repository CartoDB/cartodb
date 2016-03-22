var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerAnalysisViews = require('../../../../../javascripts/cartodb3/editor/layers/layer-analysis-views');
var LayerAnalysisViewFactory = require('../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var createDefaultVis = require('../../create-default-vis');

describe('editor/layers/layer-analysis-views', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();
    var vis = createDefaultVis();
    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: {},
      visMap: vis.map,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory();
  });

  describe('given a layer definition with only its own source', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.add({
        id: 'l1',
        options: {
          type: 'CartoDB',
          table_name: 'own_source',
          cartocss: 'asd'
        }
      });
      this.view = new LayerAnalysisViews({
        model: this.layerDefinitionsCollection.get('l1'),
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
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
            params: {
              query: 'SELECT * FROM foo'
            }
          }
        }
      });
      this.layerDefinitionsCollection.add({
        id: 'l1',
        options: {
          type: 'CartoDB',
          table_name: 'foo',
          cartocss: 'asd',
          letter: 'b',
          source: 'b1',
          name: 'layerB'
        }
      });
      this.view = new LayerAnalysisViews({
        model: this.layerDefinitionsCollection.get('l1'),
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        layerAnalysisViewFactory: this.layerAnalysisViewFactory
      });

      this.view.render();
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render the sources', function () {
      expect(this.view.$el.text()).toContain('b1');
      expect(this.view.$el.text()).toContain('trade-area');
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
          options: {
            type: 'CartoDB',
            table_name: 'foo',
            cartocss: 'asd',
            letter: 'c',
            source: 'c1',
            name: 'layerC'
          }
        });
        this.view = new LayerAnalysisViews({
          model: this.layerDefinitionsCollection.get('l2'),
          analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
          layerAnalysisViewFactory: this.layerAnalysisViewFactory
        });

        this.view.render();
      });

      it('should have no leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });

      it('should render the own source node', function () {
        expect(this.view.$el.text()).toContain('c1');
        expect(this.view.$el.text()).toContain('trade-area');
      });

      it('should render reference to other layer', function () {
        expect(this.view.$el.text()).toContain('b');
        expect(this.view.$el.text()).toContain('layerB');

        expect(this.view.$el.text()).not.toContain('b1');
        expect(this.view.$el.text()).not.toContain('b0');
      });
    });
  });
});
