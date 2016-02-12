var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetsView = require('../../../../javascripts/cartodb3/editor/editor-widgets-view');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/editor-widgets-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel();
    this.visDefinitionModel = new VisDefinitionModel({
      id: '123'
    }, {
      configModel: configModel,
      baseUrl: '/bogus',
      mapDefinitionModel: {}
    });

    this.layersCollection = new Backbone.Collection();
    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      baseUrl: '/',
      mapId: 'm-123',
      tablesCollection: {},
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
      var m = new LayerDefinitionModel({
        id: 'l-100'
      }, {
        tablesCollection: {},
        layerModel: this.layersCollection.first()
      });
      this.layerDefinitionsCollection.add(m);
      this.tableModel = {};
      spyOn(this.layerDefinitionsCollection.get('l-100'), 'getTableModel').and.returnValue(this.tableModel);

      var widget = new WidgetDefinitionModel({
        type: 'formula',
        title: 'AVG districts homes',
        layer_id: 'l-100',
        options: {
          column: 'areas',
          operation: 'avg'
        }
      }, {
        baseUrl: '/u/pepe',
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
