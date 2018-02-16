var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var LayerAnalysesView = require('builder/editor/layers/layer-analyses-view');
var LayerAnalysisViewFactory = require('builder/editor/layers/layer-analysis-view-factory');

describe('editor/layers/layer-analyses-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });
    this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      status: 'ready',
      query: 'SELECT * FROM own_source',
      table_name: 'own_source'
    });
    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    this.layerAnalysisViewFactory = new LayerAnalysisViewFactory(this.analysisDefinitionNodesCollection);
  });

  describe('given a layer definition with only its own source', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.add({
        id: 'l1',
        kind: 'carto',
        source: 'a0',
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
        status: 'ready',
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
          status: 'ready',
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
