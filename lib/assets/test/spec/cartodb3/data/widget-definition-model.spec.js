var cdb = require('cartodb-deep-insights.js');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');

describe('data/widget-definition-model', function () {
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
    var widgetDefModel = this.widgetDefModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      options: {
        column: 'hello'
      }
    }, {
      layerDefinitionModel: this.layerDefModel,
      dashboardWidgetsService: this.dashboardWidgetsService
    });

    this.widgetDefModel.save = function() {
      widgetDefModel.trigger('sync');
    };
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

  it('should remove widgetModel when model is destroyed', function () {
    this.widgetDefModel.trigger('sync');
    expect(this.widgetDefModel._widgetModel).toBeDefined();
    this.widgetDefModel.trigger('destroy');
    expect(this.widgetDefModel._widgetModel).not.toBeDefined();
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
          column: 'col',
          bins: 5,
          start: 10,
          end: 10
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
