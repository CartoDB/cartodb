var cdb = require('cartodb-deep-insights.js');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetsView = require('../../../../javascripts/cartodb3/editor/editor-widgets-view');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');

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

    this.view = new EditorWidgetsView({
      collection: this.visDefinitionModel.widgetDefinitionsCollection,
      layerDefinitionsCollection: {}
    });

    this.view.render();
  });

  describe('when adding a widget definition', function () {
    beforeEach(function () {
      var widget = new WidgetDefinitionModel({
        type: 'formula',
        title: 'AVG districts homes',
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
