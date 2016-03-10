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
