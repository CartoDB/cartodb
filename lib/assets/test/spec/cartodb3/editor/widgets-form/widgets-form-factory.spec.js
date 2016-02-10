var WidgetsFormFactory = require('../../../../../javascripts/cartodb3/editor/widgets-form/widgets-form-factory');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/editor/data/widget-definition-model');

describe('widgets-form/widgets-form-factory', function () {
  describe('formula form', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new WidgetDefinitionModel({
        layer_id: 'w-456',
        title: 'some title',
        type: 'formula',
        options: {
          column: 'hello',
          operation: 'sum',
          prefix: 'my-prefix'
        }
      }, {
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel);
      expect(model).toBeDefined();
    });
  });

  describe('category form', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new WidgetDefinitionModel({
        layer_id: 'w-456',
        title: 'some title',
        type: 'category',
        options: {
          column: 'hello'
        }
      }, {
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel);
      expect(model).toBeDefined();
    });
  });

  describe('histogram form', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new WidgetDefinitionModel({
        layer_id: 'w-456',
        title: 'some title',
        type: 'histogram',
        options: {
          column: 'hello'
        }
      }, {
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel);
      expect(model).toBeDefined();
    });
  });

  describe('time-series form', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new WidgetDefinitionModel({
        layer_id: 'w-456',
        title: 'some title',
        type: 'time-series',
        options: {
          column: 'hello'
        }
      }, {
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel);
      expect(model).toBeDefined();
    });
  });
});
