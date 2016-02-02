var cdb = require('cartodb-deep-insights.js');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data-models/layer-definition-model');

describe('widget-defintion-model', function () {
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
      title: 'some title'
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

  describe('when it defines a list widget', function () {
    beforeEach(function () {
      this.widgetDefModel.set({
        type: 'list',
        options: {
          columns: ['col1', 'col2'],
          columns_title: ['1st', '2nd']
        }
      });
    });

    describe('when is saved', function () {
      beforeEach(function () {
        spyOn(this.dashboardWidgetsService, 'createListModel').and.callThrough();
        this.widgetDefModel.trigger('sync');
      });

      it('should create the widget model', function () {
        expect(this.dashboardWidgetsService.createListModel).toHaveBeenCalled();
        var args = this.dashboardWidgetsService.createListModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({ id: 'w-456' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ title: 'some title' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ columns: ['col1', 'col2'] }));
        expect(args[0]).toEqual(jasmine.objectContaining({ columns_title: ['1st', '2nd'] }));
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
