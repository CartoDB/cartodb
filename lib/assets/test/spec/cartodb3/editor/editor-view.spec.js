var cdb = require('cartodb.js');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorView = require('../../../../javascripts/cartodb3/editor/editor-view');

describe('editor/editor-view', function () {
  beforeEach(function () {
    var basemapLayerDefModel = new LayerDefinitionModel({
      type: 'Tiled',
      name: 'Basemap is always first'
    }, {
      configModel: {}
    });

    var analysisDefinitionsCollection = new Backbone.Collection([]);
    analysisDefinitionsCollection.analysisDefinitionNodesCollection = {};

    this.view = new EditorView({
      visDefinitionModel: new cdb.core.Model({
        name: 'My super fun vis'
      }),
      modals: {},
      userModel: {},
      configModel: {},
      analysisDefinitionsCollection: analysisDefinitionsCollection,
      layerDefinitionsCollection: new Backbone.Collection([basemapLayerDefModel]),
      widgetDefinitionsCollection: new Backbone.Collection(),
      mapStackLayoutModel: {},
      selectedTabItem: 'widgets'
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('editor.button_add');
  });
});
