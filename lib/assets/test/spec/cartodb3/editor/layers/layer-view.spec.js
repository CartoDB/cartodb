var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var LayerAnalysisViewFactory = require('../../../../../javascripts/cartodb3/editor/layers/layer-analysis-view-factory');
var LayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-view');
var AnalysisDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/layers/layer-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var analysisDefinitionsCollection = new AnalysisDefinitionsCollection([], {
      configModel: configModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      configModel: configModel,
      layersCollection: new Backbone.Collection([]),
      analysisDefinitionsCollection: analysisDefinitionsCollection,
      mapId: 'map-123'
    });

    layerDefinitionsCollection.add({
      id: 'l0',
      kind: 'tiled'
    });

    layerDefinitionsCollection.add({
      id: 'l1',
      kind: 'cartodb',
      options: {
        table_name: 'districts'
      }
    });

    layerDefinitionsCollection.add({
      id: 'l2',
      kind: 'cartodb',
      options: {
        table_name: 'foobar'
      }
    });

    this.view = new LayerView({
      model: layerDefinitionsCollection.at(1),
      layerDefinitionsCollection: layerDefinitionsCollection,
      layerAnalysisViewFactory: new LayerAnalysisViewFactory(analysisDefinitionsCollection)
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$('.js-analysis').text()).toContain('a0 districts');
  });
});
