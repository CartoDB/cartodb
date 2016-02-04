var cdb = require('cartodb-deep-insights.js');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data-models/layer-definition-model');

describe('widget-definition-model', function () {
  beforeEach(function () {
    this.el = document.createElement('div');
    this.el.id = 'wdmtmp';
    document.body.appendChild(this.el);
    var dashboard = cdb.deepInsights.createDashboard('#wdmtmp', {
      user: {},
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{
        id: 'l-1',
        type: 'CartoDB'
      }],
      widgets: []
    });
    this.layerModel = dashboard.vis.map.layers.get('l-1');
    this.layerDefModel = new LayerDefinitionModel({
      id: 'l-1'
    }, {
      layerModel: this.layerModel
    });
    this.layerDefModel.url = function () {
      return '/layers/' + this.id;
    };

    this.dashboardWidgetsService = dashboard.widgets;
    this.widgetDefModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula'
    }, {
      layerDefinitionModel: this.layerDefModel,
      dashboardWidgetsService: this.dashboardWidgetsService
    });
  });

  afterEach(function () {
    document.body.removeChild(this.el);
  });

  it('should have a url pointing under layers API endpoint', function () {
    expect(this.widgetDefModel.url()).toEqual('/layers/l-1/widgets/w-456');

    // when no id:
    this.widgetDefModel.set('id', null);
    expect(this.widgetDefModel.url()).toEqual('/layers/l-1/widgets');
  });

  describe('form model', function () {
    beforeEach(function() {
      this.formModel = this.widgetDefModel._formModel;
    });

    it('should generate a form model at the beginning', function () {
      expect(this.formModel).toBeDefined();
    });

    it('should provide a public function returning _formModel', function () {
      expect(this.widgetDefModel.getFormModel()).toBe(this.formModel);
    });

    describe('on change', function () {
      beforeEach(function() {
        spyOn(this.widgetDefModel, 'save');
      });

      it('should save widget definition model when it changes', function () {
        this.formModel.set('pepito', 1);
        expect(this.widgetDefModel.save).toHaveBeenCalled();
      });

      it('should generate new form model when type attribute is changed', function () {
        spyOn(this.widgetDefModel, 'trigger');
        this.formModel.set('type', 'time-series');
        expect(this.widgetDefModel.getFormModel()).not.toBe(this.formModel);
        expect(this.widgetDefModel.get('type')).toBe('time-series');
        expect(this.widgetDefModel.save).toHaveBeenCalled();
        expect(this.widgetDefModel.trigger).toHaveBeenCalled();
      });

      it('should not keep old widget type options when the form model type is changed', function () {
        this.widgetDefModel.set('options', {
          operation: 'count',
          suffix: 'paco'
        });
        this.formModel.set('type', 'time-series');
        var newOptions = this.widgetDefModel.get('options');
        expect(newOptions.operation).toBeUndefined();
        expect(newOptions.suffix).toBeUndefined();
      });
    });
  });

  describe('.toJSON', function () {
    it('should include layer-id', function () {
      this.widgetDefModel.set('type', 'formula');
      expect(this.widgetDefModel.toJSON()).toEqual(jasmine.objectContaining({ id: 'w-456' }));
      expect(this.widgetDefModel.toJSON()).toEqual(jasmine.objectContaining({ type: 'formula' }));
      expect(this.widgetDefModel.toJSON()).toEqual(jasmine.objectContaining({ title: 'some title' }));
      expect(this.widgetDefModel.toJSON()).toEqual(jasmine.objectContaining({ layer_id: 'l-1' }));
    });

    it('should cast sync value into boolean', function () {
      this.widgetDefModel.set('options', { sync: 'true' });
      expect(this.widgetDefModel.toJSON().options).toEqual(jasmine.objectContaining({ sync: true }));
      this.widgetDefModel.set('options', { sync: 'false' });
      expect(this.widgetDefModel.toJSON().options).toEqual(jasmine.objectContaining({ sync: false }));
      this.widgetDefModel.set('options', { sync: 'whatever' });
      expect(this.widgetDefModel.toJSON().options).toEqual(jasmine.objectContaining({ sync: false }));
      this.widgetDefModel.set('options', { sync: '' });
      expect(this.widgetDefModel.toJSON().options).toEqual(jasmine.objectContaining({ sync: false }));
    });
  });

  describe('when it defines a formula widget', function () {
    beforeEach(function () {
      this.widgetDefModel.set({
        type: 'formula',
        options: {
          column: 'col',
          operation: 'avg'
        }
      });
    });

    describe('when is saved', function () {
      beforeEach(function () {
        spyOn(this.dashboardWidgetsService, 'createFormulaModel').and.callThrough();
        this.widgetDefModel.trigger('sync');
      });

      it('should create the widget model', function () {
        expect(this.dashboardWidgetsService.createFormulaModel).toHaveBeenCalled();
        var args = this.dashboardWidgetsService.createFormulaModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({ id: 'w-456' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ title: 'some title' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ column: 'col' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ operation: 'avg' }));
        expect(args[1]).toBe(this.layerModel);
        expect(this.widgetDefModel._widgetModel).toBeDefined();
      });
    });
  });

  describe('when it defines a category widget', function () {
    beforeEach(function () {
      this.widgetDefModel.set({
        type: 'category',
        options: {
          column: 'col',
          aggregation: 'sum',
          aggregationColumn: 'other_col'
        }
      });
    });

    describe('when is saved', function () {
      beforeEach(function () {
        spyOn(this.dashboardWidgetsService, 'createCategoryModel').and.callThrough();
        this.widgetDefModel.trigger('sync');
      });

      it('should create the widget model', function () {
        expect(this.dashboardWidgetsService.createCategoryModel).toHaveBeenCalled();
        var args = this.dashboardWidgetsService.createCategoryModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({ id: 'w-456' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ title: 'some title' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ column: 'col' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ aggregation: 'sum' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ aggregationColumn: 'other_col' }));
        expect(args[1]).toBe(this.layerModel);
        expect(this.widgetDefModel._widgetModel).toBeDefined();
      });
    });
  });

  describe('when it defines a histogram widget', function () {
    beforeEach(function () {
      this.widgetDefModel.set({
        type: 'histogram',
        options: {
          column: 'col',
          bins: 255
        }
      });
    });

    describe('when is saved', function () {
      beforeEach(function () {
        spyOn(this.dashboardWidgetsService, 'createHistogramModel').and.callThrough();
        this.widgetDefModel.trigger('sync');
      });

      it('should create the widget model', function () {
        expect(this.dashboardWidgetsService.createHistogramModel).toHaveBeenCalled();
        var args = this.dashboardWidgetsService.createHistogramModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({ id: 'w-456' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ title: 'some title' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ column: 'col' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ bins: 255 }));
        expect(args[1]).toBe(this.layerModel);
        expect(this.widgetDefModel._widgetModel).toBeDefined();
      });
    });
  });

  describe('when it defines a time-series widget', function () {
    beforeEach(function () {
      this.widgetDefModel.set({
        type: 'time-series',
        options: {
          column: 'col'
        }
      });
    });

    describe('when is saved', function () {
      beforeEach(function () {
        spyOn(this.dashboardWidgetsService, 'createTimeSeriesModel').and.callThrough();
        this.widgetDefModel.trigger('sync');
      });

      it('should create the widget model', function () {
        expect(this.dashboardWidgetsService.createTimeSeriesModel).toHaveBeenCalled();
        var args = this.dashboardWidgetsService.createTimeSeriesModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({ id: 'w-456' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ title: 'some title' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ column: 'col' }));
        expect(args[1]).toBe(this.layerModel);
        expect(this.widgetDefModel._widgetModel).toBeDefined();
      });
    });
  });
});
