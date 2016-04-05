var CompositeLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/composite-layer-analysis-view');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var createDefaultVis = require('../../../create-default-vis');

describe('editor/layers/analysis-views/composite-layer-analysis-view', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {}
    });

    this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'point-in-polygon',
      params: {
        points_source: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        },
        polygons_source: {
          id: 'b0',
          type: 'source',
          params: {
            query: 'SELECT * FROM bar'
          }
        }
      }
    });
    var model = this.analysisDefinitionNodesCollection.get('a1');

    var vis = createDefaultVis();

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
        table_name: 'foobar',
        cartocss: 'asd'
      }
    });
    this.layerDefinitionsCollection.add({
      id: 'l2',
      options: {
        type: 'CartoDB',
        table_name: 'foobar',
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

  it('should render the two sources as separate views', function () {
    expect(this.view.$('li:first').text()).toContain('a1');
    expect(this.view.$('li:first').text()).toContain('point-in-polygon');
    expect(this.view.$('li:last').text()).toContain('b');
    expect(this.view.$('li:last').text()).toContain('foobar');
  });
});
