var ConfigModel = require('builder/data/config-model');
var CompositeLayerAnalysisView = require('builder/editor/layers/analysis-views/composite-layer-analysis-view');
var UserModel = require('builder/data/user-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('editor/layers/analysis-views/composite-layer-analysis-view', function () {
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
      id: 'a1',
      type: 'intersection',
      primary_source_name: 'target',
      status: 'ready',
      params: {
        source: {
          id: 'b0', // ref, belongs to another layer
          type: 'source',
          params: {
            query: 'SELECT * FROM second'
          },
          options: {
            table_name: 'second'
          }
        },
        target: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM first'
          },
          options: {
            table_name: 'first'
          }
        }
      }
    });
    var model = this.analysisDefinitionNodesCollection.get('a1');

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add({
      id: 'l1',
      kind: 'carto',
      options: {
        table_name: 'first',
        cartocss: 'asd'
      }
    });
    this.layerDefinitionsCollection.add({
      id: 'l2',
      kind: 'carto',
      options: {
        table_name: 'second',
        cartocss: 'asd'
      }
    });

    this.layerDefinitionModel = this.layerDefinitionsCollection.at(0);
    this.layerDefinitionModel.set({ source: model.id });

    this.view = new CompositeLayerAnalysisView({
      model: model,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when secondary source is a source node belonging to another layer', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('.js-primary-source').text()).toContain('a1');
      expect(this.view.$('.js-primary-source').text()).toContain('intersection');
    });

    it('should render the secondary source as a reference to the other layer', function () {
      expect(this.view.$('.js-secondary-source').text()).toContain('second');
    });

    it('should render the id', function () {
      expect(this.view.$('.js-secondary-source').text()).toContain('b0');
    });
  });

  describe('when secondary source is a (non-source) node belonging to another layer ', function () {
    beforeEach(function () {
      this.analysisDefinitionNodesCollection.add({
        id: 'b1',
        type: 'buffer',
        status: 'ready',
        params: {
          radius: 100,
          source: this.analysisDefinitionNodesCollection.get('b0').toJSON()
        }
      });
      this.analysisDefinitionNodesCollection.get('a1').set('source', 'b1');
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('.js-primary-source').text()).toContain('a1');
      expect(this.view.$('.js-primary-source').text()).toContain('intersection');
    });

    it('should render the secondary source as a reference to the other layer', function () {
      expect(this.view.$('.js-secondary-source').text()).toContain('area-of-influence');
    });

    it('should render the id', function () {
      expect(this.view.$('.js-secondary-source').text()).toContain('b1');
    });
  });

  describe('when secondary source is a source node belonging to own layer', function () {
    beforeEach(function () {
      this.analysisDefinitionNodesCollection.get('b0').set('id', 'own');
      this.analysisDefinitionNodesCollection.get('a1').set('source', 'own');
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('.js-primary-source').text()).toContain('a1');
      expect(this.view.$('.js-primary-source').text()).toContain('intersection');
    });

    it('should render the secondary source as a source but without the id', function () {
      expect(this.view.$('.js-secondary-source').text()).toContain('second');
    });

    it('should not render the id', function () {
      expect(this.view.$('.js-secondary-source').text()).not.toContain('own');
    });
  });
});
