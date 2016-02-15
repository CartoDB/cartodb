var _ = require('underscore');
var Backbone = require('backbone');
var WidgetsFormFactory = require('../../../../../../../javascripts/cartodb3/editor/map/widgets/widgets-form/widgets-form-factory');
var WidgetDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/map/widgets/widgets-form/widgets-form-factory', function () {
  beforeEach(function () {
    this.tableModel = {};
  });

  describe('formula data form', function () {
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
      var model = WidgetsFormFactory.createWidgetFormDataModel(this.widgetDefinitionModel, this.tableModel);
      expect(model).toBeDefined();
    });
  });

  describe('category data form', function () {
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
      var model = WidgetsFormFactory.createWidgetFormDataModel(this.widgetDefinitionModel, this.tableModel);
      expect(model).toBeDefined();
    });
  });

  describe('histogram data form', function () {
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
      var model = WidgetsFormFactory.createWidgetFormDataModel(this.widgetDefinitionModel, this.tableModel);
      expect(model).toBeDefined();
    });
  });

  describe('time-series data form', function () {
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
      var model = WidgetsFormFactory.createWidgetFormDataModel(this.widgetDefinitionModel, this.tableModel);
      expect(model).toBeDefined();
    });
  });

  describe('type validation', function () {
    beforeEach(function () {
      this.columnsCollection = new Backbone.Collection();

      this.tableModel = {};
      this.tableModel.columnsCollection = this.columnsCollection;

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

    describe('data validation', function () {
      it('should return the valid widget types for string columns', function () {
        this.columnsCollection.reset([
          { name: 'cartodb_id', type: 'string' },
          { name: 'nobel_prizes_winners', type: 'string' },
          { name: 'year', type: 'string' }
        ]);

        var types = WidgetsFormFactory.getDataTypes(this.tableModel);
        var values = _.pluck(types, 'value');
        expect(values.sort()).toEqual(['category']);
      });

      it('should return the valid widget types for numeric columns', function () {
        this.columnsCollection.reset([
          { name: 'cartodb_id', type: 'number' },
          { name: 'year', type: 'number' }
        ]);

        var types = WidgetsFormFactory.getDataTypes(this.tableModel);
        var values = _.pluck(types, 'value');
        expect(values.sort()).toEqual(['category', 'formula', 'histogram']);
      });

      it('should return the valid widget types for date columns', function () {
        this.columnsCollection.reset([
          { name: 'year', type: 'date' }
        ]);

        var types = WidgetsFormFactory.getDataTypes(this.tableModel);
        var values = _.pluck(types, 'value');
        expect(values.sort()).toEqual(['category', 'time-series']);
      });
    });
  });
});
