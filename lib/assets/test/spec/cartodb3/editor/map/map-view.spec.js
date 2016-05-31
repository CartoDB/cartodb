var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorMapView = require('../../../../../javascripts/cartodb3/editor/map/map-view');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/map/map-view', function () {
  beforeEach(function () {
    var configModel = 'c';
    var basemapLayerDefModel = new LayerDefinitionModel({
      type: 'Tiled',
      name: 'Basemap is always first'
    }, {
      configModel: {}
    });

    this.view = new EditorMapView({
      visDefinitionModel: new cdb.core.Model({
        name: 'My super fun vis'
      }),
      modals: {},
      analysis: {},
      configModel: configModel,
      userModel: new cdb.core.Model({}, { configModel: configModel }),
      editorModel: new EditorModel(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: new Backbone.Collection([basemapLayerDefModel]),
      widgetDefinitionsCollection: new Backbone.Collection()
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have one subview', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('My super fun vis');
    expect(this.view.$el.text()).toContain('editor.tab-pane.layers.title-label');
    expect(this.view.$el.text()).toContain('editor.tab-pane.elements.title-label');
    expect(this.view.$el.text()).toContain('editor.tab-pane.widgets.title-label');
  });

  it('should render correctly when editing', function () {
    this.view._editorModel.set({edition: true});
    expect(this.view.$('.Editor-panel.is-dark').length).toBe(1);
  });
});
