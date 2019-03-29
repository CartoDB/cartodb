var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var WidgetsFormColumnOptionsFactory = require('builder/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormTimeSeriesSchemaModel = require('builder/editor/widgets/widgets-form/schema/widgets-form-time-series-schema-model');
var FactoryModals = require('../../../../factories/modals');

describe('editor/widgets/widgets-form/schema/widgets-form-time-series-schema-model', function () {
  beforeEach(function () {
    var userModel = {
      featureEnabled: function () {
        return true;
      }
    };

    var configModel = new ConfigModel({
      user_name: 'pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: configModel
    });
    this.querySchemaModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);

    this.widgetsFormColumnOptionsFactory = new WidgetsFormColumnOptionsFactory(this.querySchemaModel);
    spyOn(this.widgetsFormColumnOptionsFactory, 'create').and.returnValue([{
      val: 'col',
      label: 'col',
      type: 'number'
    }, {
      val: 'col2',
      label: 'col2',
      type: 'string'
    }]);

    this.modals = FactoryModals.createModalService();

    this.model = new WidgetsFormTimeSeriesSchemaModel({
      type: 'time-series',
      column: 'cartodb_id'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory,
      querySchemaModel: this.querySchemaModel,
      userModel: userModel,
      configModel: configModel,
      modals: this.modals
    });
  });

  it('should call ._onColumnChanged when column changes', function () {
    spyOn(this.model, '_onColumnChanged');
    this.model._initBinds();

    this.model.trigger('change:column');
    expect(this.model._onColumnChanged).toHaveBeenCalled();
  });

  it('should call .updateSchema when _timeSeriesQueryModel buckets change', function () {
    spyOn(this.model, 'updateSchema');
    this.model._initBinds();

    this.model._timeSeriesQueryModel.trigger('change:buckets');
    expect(this.model.updateSchema).toHaveBeenCalled();
  });

  describe('.updateSchema', function () {
    beforeEach(function () {
      spyOn(this.model._querySchemaModel, 'isFetched').and.returnValue(true);
    });

    it('always have column and widget_style_definition', function () {
      this.model.updateSchema();
      expect(this.model.schema.column).toBeDefined();
      expect(this.model.schema.widget_style_definition).toBeDefined();
    });

    it('should have aggregation, and timezone if column is type date', function () {
      spyOn(this.model, '_getColumnType').and.returnValue('date');
      this.model.updateSchema();
      expect(this.model.schema.aggregation).toBeDefined();
      expect(this.model.schema.timezone).toBeDefined();
      expect(this.model.schema.bins).not.toBeDefined();
    });

    it('should have bins if column is not type date', function () {
      this.model.updateSchema();
      expect(this.model.schema.bins).toBeDefined();
      expect(this.model.schema.aggregation).not.toBeDefined();
      expect(this.model.schema.timezone).not.toBeDefined();
    });
  });

  describe('.getFields', function () {
    it('should return column', function () {
      var fields = this.model.getFields();
      expect(fields.data).toContain('column');
    });

    it('should return aggregation if column type is date', function () {
      spyOn(this.model, '_getColumnType').and.returnValue('date');
      var fields = this.model.getFields();
      expect(fields.data).toContain('aggregation');
      expect(fields.data).toContain('timezone');
      expect(fields.data).not.toContain('bins');
    });

    it('should not return aggregation, and timezone if column type is not date', function () {
      var fields = this.model.getFields();
      expect(fields.data).toContain('bins');
      expect(fields.data).not.toContain('aggregation');
      expect(fields.data).not.toContain('timezone');
    });

    it('should return sync_on_bbox_change', function () {
      var fields = this.model.getFields();
      expect(fields.style).toContain('sync_on_bbox_change');
    });

    it('should return widget_style_definition', function () {
      var fields = this.model.getFields();
      expect(fields.style).toContain('widget_style_definition');
    });
  });

  describe('._isDateType', function () {
    it('should return true if type is date', function () {
      var model = new Backbone.Model({ type: 'number' });
      expect(this.model._isDateType(model)).toBe(false);

      model.set('type', 'date');
      expect(this.model._isDateType(model)).toBe(true);
    });
  });

  describe('._isNumberType', function () {
    it('should return true if type is number', function () {
      var model = new Backbone.Model({ type: 'date' });
      expect(this.model._isNumberType(model)).toBe(false);

      model.set('type', 'number');
      expect(this.model._isNumberType(model)).toBe(true);
    });
  });

  describe('._isNumberOrDateType', function () {
    it('should return true if type is number', function () {
      var model = new Backbone.Model({ type: 'string' });
      expect(this.model._isNumberOrDateType(model)).toBe(false);

      model.set('type', 'number');
      expect(this.model._isNumberOrDateType(model)).toBe(true);

      model.set('type', 'date');
      expect(this.model._isNumberOrDateType(model)).toBe(true);
    });
  });

  describe('._prepareAttributesForWidgetDefinition', function () {
    describe('column type is date', function () {
      it('should set bins to undefined and assign an offset to the timezone', function () {
        spyOn(this.model, '_getColumnType').and.returnValue('date');

        this.model.set({
          bins: '100',
          timezone: 'America/Barbados'
        });

        var attrs = this.model._prepareAttributesForWidgetDefinition();
        expect(attrs.bins).toBeUndefined();
        expect(attrs.offset).toBe(-14400);
        expect(attrs.timezone).toBe('America/Barbados');
      });
    });

    describe('column type is not date', function () {
      it('should set aggregation, timezone, and offset to undefined', function () {
        spyOn(this.model, '_getColumnType').and.returnValue('number');

        this.model.set({
          aggregation: 'month',
          timezone: 'Atlantic/Canary'
        });

        var attrs = this.model._prepareAttributesForWidgetDefinition();
        expect(attrs.aggregation).toBeUndefined();
        expect(attrs.timezone).toBeUndefined();
        expect(attrs.offset).toBeUndefined();
      });
    });
  });

  describe('._getColumnType', function () {
    it('should return the column type', function () {
      this.model.set('column', 'cartodb_id');
      expect(this.model._getColumnType()).toEqual('number');
    });
  });
});
