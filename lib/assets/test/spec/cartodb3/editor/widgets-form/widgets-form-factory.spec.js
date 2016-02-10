var WidgetsFormFactory = require('../../../../../javascripts/cartodb3/editor/widgets-form/widgets-form-factory');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets-form/widgets-form-factory', function () {
  beforeEach(function () {
    this.tablesCollection = {};
  });

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
        baseUrl: '/u/pepe',
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel, this.tablesCollection);
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
        baseUrl: '/u/pepe',
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel, this.tablesCollection);
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
        baseUrl: '/u/pepe',
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel, this.tablesCollection);
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
        baseUrl: '/u/pepe',
        layerDefinitionModel: {},
        dashboardWidgetsService: {}
      });
    });

    it('should generate the widget form model', function () {
      var model = WidgetsFormFactory.createWidgetFormModel('data', this.widgetDefinitionModel, this.tablesCollection);
      expect(model).toBeDefined();
    });
  });
});
