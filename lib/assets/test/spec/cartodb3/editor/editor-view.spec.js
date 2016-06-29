var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorView = require('../../../../javascripts/cartodb3/editor/editor-view');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');
var EditorModel = require('../../../../javascripts/cartodb3/data/editor-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');

describe('editor/editor-view', function () {
  beforeEach(function () {
    var layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-100',
      kind: 'carto'
    }, {
      parse: true,
      configModel: {}
    });

    this.widgetDefinitionsCollection = new Backbone.Collection();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    var userModel = new Backbone.Model({
      actions: {
        private_maps: true,
        private_tables: true
      }
    });

    this.view = new EditorView({
      visDefinitionModel: visDefinitionModel,
      modals: {},
      analysis: {},
      userModel: userModel,
      editorModel: new EditorModel(),
      pollingModel: new Backbone.Model(),
      configModel: {},
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: new Backbone.Collection([layerDefinitionModel]),
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      mapStackLayoutModel: jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'nextStep']),
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

  it('should have two subviews', function () {
    expect(_.size(this.view._subviews)).toBe(2);
  });

  describe('add button', function () {
    beforeEach(function () {
      this.widgetDefModel = new WidgetDefinitionModel({
        type: 'formula',
        title: 'formula example',
        layer_id: 'l-100',
        column: 'areas',
        operation: 'avg',
        order: 0
      }, {
        configModel: {},
        mapId: 'm-123'
      });
    });

    it('should be displayed when there are items on the selected tab', function () {
      expect(this.view.$('.js-add').hasClass('is-hidden')).toBeTruthy();

      this.widgetDefinitionsCollection.add(this.widgetDefModel);
      expect(this.view.$('.js-add').hasClass('is-hidden')).toBeFalsy();
    });

    it('should be hidden when an item is removed', function () {
      this.widgetDefinitionsCollection.add(this.widgetDefModel);
      this.widgetDefinitionsCollection.reset([]);
      expect(this.view.$('.js-add').hasClass('is-hidden')).toBeTruthy();
    });
  });
});
