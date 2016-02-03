var EditorWidgetsView = require('../../../../javascripts/cartodb3/editor/editor-widgets-view');
var VisualizationModel = require('../../../../javascripts/cartodb3/data-models/visualization-model');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');
var cdb = require('cartodb-deep-insights.js');

describe('editor/editor-widgets-view', function () {
  beforeEach(function () {
    this.visualizationModel = new VisualizationModel({
      id: '123',
      urlRoot: 'url'
    });

    this.view = new EditorWidgetsView({
      collection: this.visualizationModel.widgetDefinitionsCollection
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
        layerDefinitionModel: new cdb.core.Model(),
        dashboardWidgetsService: new cdb.core.Model()
      });

      this.visualizationModel.widgetDefinitionsCollection.add(widget);
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
