var CompositeLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/composite-layer-analysis-view');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var createDefaultVis = require('../../../create-default-vis');

describe('editor/layers/analysis-views/composite-layer-analysis-view', function () {
  beforeEach(function () {
    var vis = createDefaultVis();
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {},
      analysis: vis.analysis
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'point-in-polygon',
      primary_source_name: 'polygons_source',
      params: {
        points_source: {
          id: 'b0', // ref, belongs to another layer
          type: 'source',
          table_name: 'second',
          params: {
            query: 'SELECT * FROM second'
          }
        },
        polygons_source: {
          id: 'a0',
          type: 'source',
          table_name: 'first',
          params: {
            query: 'SELECT * FROM first'
          }
        }
      }
    });
    var model = this.analysisDefinitionNodesCollection.get('a1');

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: {},
      visMap: vis.map,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });

    this.layerDefinitionsCollection.add({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'first',
        cartocss: 'asd'
      }
    });
    this.layerDefinitionsCollection.add({
      id: 'l2',
      options: {
        type: 'CartoDB',
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

  describe('when secondary source is using node belonging to another layer', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('li:first').text()).toContain('a1');
      expect(this.view.$('li:first').text()).toContain('point-in-polygon');
    });

    it('should render the secondary source as a reference to the other layer', function () {
      expect(this.view.$('li:last').text()).toContain('b');
      expect(this.view.$('li:last').text()).toContain('second');
    });
  });

  describe('when secondary source is a source belonging to own layer', function () {
    beforeEach(function () {
      this.analysisDefinitionNodesCollection.get('b0').set('id', 'a1-secondary');
      this.analysisDefinitionNodesCollection.get('a1').set('points_source', 'a1-secondary');
      this.view.render();
    });

    it('should render the own source', function () {
      expect(this.view.$('li:first').text()).toContain('a1');
      expect(this.view.$('li:first').text()).toContain('point-in-polygon');
    });

    it('should render the secondary source as a source but without the id', function () {
      expect(this.view.$('li:last').text()).toContain('second');
      expect(this.view.$('li:last').text()).not.toContain('b');
      expect(this.view.$('li:last').text()).not.toContain('a1-secondary');
    });
  });
});
