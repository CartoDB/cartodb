var cdb = require('cartodb.js');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorView = require('../../../../javascripts/cartodb3/editor/editor-view');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/editor-view', function () {
  beforeEach(function () {
    var layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-100',
      options: {
        type: 'CartoDB'
      }
    }, {
      parse: true,
      configModel: {}
    });

    this.widgetDefinitionsCollection = new Backbone.Collection();

    this.view = new EditorView({
      visDefinitionModel: new cdb.core.Model({
        name: 'My super fun vis'
      }),
      modals: {},
      analysis: {},
      userModel: {},
      configModel: {},
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: new Backbone.Collection([layerDefinitionModel]),
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
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
