var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetsView = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widgets-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new LayerDefinitionModel({
      id: 'l-100',
      type: 'tile'
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.widgetDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection = new Backbone.Collection([
      this.model
    ]);

    this.view = new EditorWidgetsView({
      modals: {},
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      stackLayoutModel: {}
    });
    this.view.render();
  });

  describe('sortable', function () {
    beforeEach(function () {
      this.widgetDefModel1 = new WidgetDefinitionModel({
        type: 'formula',
        title: 'formula example',
        layer_id: 'l-100',
        column: 'areas',
        operation: 'avg',
        order: 0
      }, {
        configModel: this.configModel,
        mapId: 'm-123'
      });
      this.widgetDefModel2 = new WidgetDefinitionModel({
        type: 'histogram',
        title: 'histogram example',
        layer_id: 'l-100',
        column: 'population',
        order: 1
      }, {
        configModel: this.configModel,
        mapId: 'm-123'
      });
      this.widgetDefinitionsCollection.add(this.widgetDefModel1);
      this.widgetDefinitionsCollection.add(this.widgetDefModel2);
    });

    it('should be initialized when view is rendered', function () {
      spyOn(this.view, '_initSortable').and.callThrough();
      this.view.render();
      expect(this.view._initSortable).toHaveBeenCalled();
      expect(this.view.$('.js-widgets').data('ui-sortable')).not.toBeUndefined();
    });

    it('should update the order of the models when sort has finished', function () {
      this.view.render();
      expect(this.widgetDefModel2.get('order')).toBe(1);
      expect(this.widgetDefModel1.get('order')).toBe(0);
      // Impossible to fake sortable behaviour so...
      this.view.$('.js-widgetItem:eq(1)').insertBefore(this.view.$('.js-widgetItem:eq(0)'));
      this.view._onSortableFinish();
      // End of fake sortable
      expect(this.widgetDefModel2.get('order')).toBe(0);
      expect(this.widgetDefModel1.get('order')).toBe(1);
    });
  });

  describe('when adding a widget definition', function () {
    beforeEach(function () {
      var widgetDefModel = new WidgetDefinitionModel({
        type: 'formula',
        title: 'AVG districts homes',
        layer_id: 'l-100',
        column: 'areas',
        operation: 'avg'
      }, {
        configModel: this.configModel,
        mapId: 'm-123'
      });
      this.widgetDefinitionsCollection.add(widgetDefModel);
    });

    it('should have no leaks', function () {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });

    it('should add a widget definition', function () {
      expect(this.view.$el.text()).toContain('AVG districts home');
    });

    afterEach(function () {
      this.view.clean();
    });
  });
});
