var cdb = require('cartodb.js');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var createDefaultVis = require('../../../create-default-vis');

describe('editor/layers/layer-content-view/infowindow-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var vis = createDefaultVis();

    this.sqlAPI = new cdb.SQL({
      user: 'pepe'
    });
    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: this.sqlAPI
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
      },
      infowindow: {
        'fields': [
          {
            'name': 'description',
            'title': true,
            'position': 0
          },
          {
            'name': 'name',
            'title': true,
            'position': 1
          }
        ],
        'template_name': 'table/views/infowindow_light',
        'template': '',
        'alternative_names': {},
        'width': 226,
        'maxHeight': 180
      }
    });

    this.view = new InfowindowView({
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });
    this.view.render();
  });

  describe('render', function () {
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
