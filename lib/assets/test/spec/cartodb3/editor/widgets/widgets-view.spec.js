var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetsView = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-view');
var VisDefinitionModel = require('../../../../../javascripts/cartodb3/data/vis-definition-model');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/widgets/widgets-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.visDefinitionModel = new VisDefinitionModel({
      id: '123'
    }, {
      configModel: this.configModel,
      mapDefinitionModel: {}
    });

    this.layersCollection = new Backbone.Collection();
    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      configModel: this.configModel,
      mapId: 'm-123',
      layersCollection: this.layersCollection
    });
    this.view = new EditorWidgetsView({
      widgetDefinitionsCollection: this.visDefinitionModel.widgetDefinitionsCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    this.view.render();
  });

  describe('when adding a widget definition', function () {
    beforeEach(function () {
      this.layersCollection.add({
        id: 'l-100'
      });
      this.layerDefinitionsCollection.add({
        id: 'l-100',
        options: {
          table_name: 'foobar'
        }
      });
      this.layerTableModel = this.layerDefinitionsCollection.get('l-100').layerTableModel;

      var widget = new WidgetDefinitionModel({
        type: 'formula',
        title: 'AVG districts homes',
        layer_id: 'l-100',
        options: {
          column: 'areas',
          operation: 'avg'
        }
      }, {
        configModel: this.configModel,
        layerDefinitionModel: new cdb.core.Model(),
        dashboardWidgetsService: new cdb.core.Model()
      });
      this.visDefinitionModel.widgetDefinitionsCollection.add(widget);
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
