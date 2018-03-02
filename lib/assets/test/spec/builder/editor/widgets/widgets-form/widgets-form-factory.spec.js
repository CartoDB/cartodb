var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var WidgetsFormFactory = require('builder/editor/widgets/widgets-form/widgets-form-factory');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var FactoryModals = require('../../../factories/modals');

describe('editor/widgets/widgets-form/widgets-form-factory', function () {
  var userModel = {
    featureEnabled: function (whatever) {
      return true;
    }
  };

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });
    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar'
    }, {
      configModel: this.configModel
    });

    this.modals = FactoryModals.createModalService();
  });

  describe('data form', function () {
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
          configModel: this.configModel,
          mapId: 'm-123'
        });
      });

      it('should generate the widget form model', function () {
        var model = WidgetsFormFactory.createWidgetFormModel({
          widgetDefinitionModel: this.widgetDefinitionModel,
          querySchemaModel: this.querySchemaModel,
          modals: this.modals,
          userModel: userModel,
          configModel: this.configModel
        });
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
          configModel: this.configModel,
          mapId: 'm-123'
        });
      });

      it('should generate the widget form model', function () {
        var model = WidgetsFormFactory.createWidgetFormModel({
          widgetDefinitionModel: this.widgetDefinitionModel,
          querySchemaModel: this.querySchemaModel,
          modals: this.modals,
          userModel: userModel,
          configModel: this.configModel
        });
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
          configModel: this.configModel,
          mapId: 'm-123'
        });
      });

      it('should generate the widget form model', function () {
        var model = WidgetsFormFactory.createWidgetFormModel({
          widgetDefinitionModel: this.widgetDefinitionModel,
          querySchemaModel: this.querySchemaModel,
          modals: this.modals,
          userModel: userModel,
          configModel: this.configModel
        });
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
          configModel: this.configModel,
          mapId: 'm-123'
        });
      });

      it('should generate the widget form model', function () {
        var model = WidgetsFormFactory.createWidgetFormModel({
          widgetDefinitionModel: this.widgetDefinitionModel,
          querySchemaModel: this.querySchemaModel,
          modals: this.modals,
          userModel: userModel,
          configModel: this.configModel
        });
        expect(model).toBeDefined();
      });
    });

    describe('style', function () {
      describe('rest style form', function () {
        beforeEach(function () {
          this.widgetDefinitionModel = new WidgetDefinitionModel({
            layer_id: 'w-456',
            title: 'some title',
            type: 'category',
            options: {
              column: 'hello'
            }
          }, {
            configModel: this.configModel,
            mapId: 'm-123'
          });
        });

        it('should generate the widget form model', function () {
          var model = WidgetsFormFactory.createWidgetFormModel({
            widgetDefinitionModel: this.widgetDefinitionModel,
            querySchemaModel: this.querySchemaModel,
            modals: this.modals,
            userModel: userModel,
            configModel: this.configModel
          });
          expect(model.schema.description).not.toBeDefined();
          expect(model.schema.sync_on_bbox_change).toBeDefined();
        });
      });

      describe('formula style form', function () {
        beforeEach(function () {
          this.widgetDefinitionModel = new WidgetDefinitionModel({
            layer_id: 'w-456',
            title: 'helloooo',
            type: 'formula',
            options: {
              column: 'hello'
            }
          }, {
            configModel: this.configModel,
            mapId: 'm-123'
          });
        });

        it('should generate the widget form model', function () {
          var model = WidgetsFormFactory.createWidgetFormModel({
            widgetDefinitionModel: this.widgetDefinitionModel,
            querySchemaModel: this.querySchemaModel,
            modals: this.modals,
            userModel: userModel,
            configModel: this.configModel
          });
          expect(model).toBeDefined();

          model.updateSchema();
          expect(model.schema.description).toBeDefined();
          expect(model.schema.sync_on_bbox_change).toBeDefined();
        });
      });
    });
  });

  describe('type validation', function () {
    beforeEach(function () {
      this.widgetDefinitionModel = new WidgetDefinitionModel({
        layer_id: 'w-456',
        title: 'some title',
        type: 'time-series',
        options: {
          column: 'hello'
        }
      }, {
        configModel: this.configModel,
        mapId: 'm-123'
      });
    });

    describe('data validation', function () {
      it('should return the valid widget types for string columns', function () {
        this.querySchemaModel.columnsCollection.reset([
          { name: 'cartodb_id', type: 'string' },
          { name: 'nobel_prizes_winners', type: 'string' },
          { name: 'year', type: 'string' }
        ]);

        var types = WidgetsFormFactory.getDataTypes(this.querySchemaModel);
        var values = _.pluck(types, 'value');
        expect(values.sort()).toEqual(['category']);
      });

      it('should return the valid widget types for numeric columns', function () {
        this.querySchemaModel.columnsCollection.reset([
          { name: 'cartodb_id', type: 'number' },
          { name: 'year', type: 'number' }
        ]);

        var types = WidgetsFormFactory.getDataTypes(this.querySchemaModel);
        var values = _.pluck(types, 'value');
        expect(values.sort()).toEqual(['category', 'formula', 'histogram', 'time-series']);
      });

      it('should return the valid widget types for date columns', function () {
        this.querySchemaModel.columnsCollection.reset([
          { name: 'year', type: 'date' }
        ]);

        var types = WidgetsFormFactory.getDataTypes(this.querySchemaModel);
        var values = _.pluck(types, 'value');
        expect(values.sort()).toEqual(['category', 'time-series']);
      });
    });
  });
});
