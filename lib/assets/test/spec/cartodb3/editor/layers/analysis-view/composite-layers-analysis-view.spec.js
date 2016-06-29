var Backbone = require('backbone');
var CompositeLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/composite-layer-analysis-view');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('editor/layers/analysis-views/composite-layer-analysis-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'point-in-polygon',
      primary_source_name: 'polygons_source',
      params: {
        points_source: {
          id: 'b0', // ref, belongs to another layer
          type: 'source',
          params: {
            query: 'SELECT * FROM second'
          },
          options: {
            table_name: 'second'
          }
        },
        polygons_source: {
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
      configModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      basemaps: {}
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

    this.analysisNode = new Backbone.Model({
      status: 'ready'
    });
    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    this.analysis.findNodeById.and.returnValue(this.analysisNode);

    this.view = new CompositeLayerAnalysisView({
      model: model,
      analysis: this.analysis,
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
      expect(this.view.$('.js-primary-source').text()).toContain('point-in-polygon');
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
        params: {
          radius: 100,
          source: this.analysisDefinitionNodesCollection.get('b0').toJSON()
        }
      });
      this.analysisDefinitionNodesCollection.get('a1').set('points_source', 'b1');
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('.js-primary-source').text()).toContain('a1');
      expect(this.view.$('.js-primary-source').text()).toContain('point-in-polygon');
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
      this.analysisDefinitionNodesCollection.get('a1').set('points_source', 'own');
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('.js-primary-source').text()).toContain('a1');
      expect(this.view.$('.js-primary-source').text()).toContain('point-in-polygon');
    });

    it('should render the secondary source as a source but without the id', function () {
      expect(this.view.$('.js-secondary-source').text()).toContain('second');
    });

    it('should not render the id', function () {
      expect(this.view.$('.js-secondary-source').text()).not.toContain('own');
    });
  });
});
