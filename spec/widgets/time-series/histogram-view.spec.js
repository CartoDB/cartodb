var Backbone = require('backbone');
var HistogramView = require('../../../src/widgets/time-series/histogram-view');
var HistogramChartView = require('../../../src/widgets/histogram/chart');
var specHelper = require('../../spec-helper');

describe('widgets/time-series/histogram-view', function () {
  beforeEach(function () {
    this.timeSeriesModel = new Backbone.Model();
    this.timeSeriesModel.getWidgetColor = function () {};

    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      id: 'widget_3',
      column: 'col',
      column_type: 'date'
    });

    spyOn(HistogramChartView.prototype, 'initialize');
    spyOn(HistogramChartView.prototype, 'render').and.callFake(function () {
      return {
        el: '<chart></chart>'
      };
    });

    this.view = new HistogramView({
      timeSeriesModel: this.timeSeriesModel,
      dataviewModel: this.dataviewModel,
      rangeFilter: this.dataviewModel.filter,
      displayShadowBars: false,
      normalized: true,
      local_timezone: false
    });
  });

  describe('._initBinds', function () {
    it('should hook up events properly', function () {
      this.view._dataviewModel.off();
      this.view._chartView = {
        setNormalized: function () {},
        removeSelection: function () {},
        forceResize: function () {}
      };
      spyOn(this.view, '_onChangeData');
      spyOn(this.view, '_onNormalizedChanged');
      spyOn(this.view, '_onChangeLocalTimezone');
      spyOn(this.view, '_onForceResize');
      spyOn(this.view, '_onFilterChanged');

      this.view._initBinds();

      this.view._dataviewModel.trigger('change:data');
      expect(this.view._onChangeData).toHaveBeenCalled();

      this.view._timeSeriesModel.trigger('change:normalized');
      expect(this.view._onNormalizedChanged).toHaveBeenCalled();

      this.view._timeSeriesModel.trigger('change:local_timezone');
      expect(this.view._onChangeLocalTimezone).toHaveBeenCalled();

      this.view._timeSeriesModel.trigger('forceResize');
      expect(this.view._onForceResize).toHaveBeenCalled();

      this.view._rangeFilter.trigger('change');
      expect(this.view._onFilterChanged).toHaveBeenCalled();
    });
  });

  describe('.resetFilter', function () {
    it('should unset range in filter and reset filter internally', function () {
      spyOn(this.view._rangeFilter, 'unsetRange').and.callThrough();
      spyOn(this.view, '_resetFilterInDI');
      this.view._rangeFilter.set({ min: 10, max: 50 });

      this.view.resetFilter();

      expect(this.view._rangeFilter.unsetRange).toHaveBeenCalled();
      expect(this.view._resetFilterInDI).toHaveBeenCalled();
    });
  });

  describe('._instantiateChartView', function () {
    it('should have been called with proper values', function () {
      this.timeSeriesModel.set({
        normalized: true,
        local_timezone: true
      });

      this.view._instantiateChartView();

      expect(HistogramChartView.prototype.initialize).toHaveBeenCalled();
      var args = HistogramChartView.prototype.initialize.calls.mostRecent().args[0];
      expect(args.type).toEqual('time-date');
      expect(args.displayShadowBars).toBe(false);
      expect(args.normalized).toBe(true);
      expect(args.local_timezone).toBe(true);
    });
  });

  describe('._createHistogramView', function () {
    it('should call to `_instantiateChartView`', function () {
      var chartMock = new Backbone.View();
      chartMock.model = new Backbone.Model();
      chartMock.show = function () {};
      spyOn(this.view, '_instantiateChartView').and.returnValue(chartMock);

      this.view._createHistogramView();

      expect(this.view._instantiateChartView).toHaveBeenCalled();
    });
  });

  describe('_onNormalizedChanged', function () {
    it('should call `setNormalized` on its chart view', function () {
      this.view._timeSeriesModel.set('normalized', true);
      var arg = null;
      this.view._chartView = {
        setNormalized: function (normalized) {
          arg = normalized;
        }
      };

      this.view._onNormalizedChanged();

      expect(arg).toBe(true);
    });
  });

  describe('_onChangeLocalTimezone', function () {
    it('should set `localTimezone` in dataviewmodel with its current value', function () {
      this.view._dataviewModel.set('localTimezone', false, { silent: true });
      this.view._timeSeriesModel.set('local_timezone', true);

      this.view._onChangeLocalTimezone();

      expect(this.view._dataviewModel.get('localTimezone')).toBe(true);
    });
  });

  describe('_onForceResize', function () {
    it('should call _chartView.forceResize function', function () {
      this.view._chartView = jasmine.createSpyObj('_chartView', ['forceResize']);
      this.view._initBinds();
      this.view._onForceResize();

      expect(this.view._chartView.forceResize).toHaveBeenCalled();
    });
  });

  describe('_onFilterChanged', function () {
    it('should call _resetFilterInDI if filter doesnt have min and max', function () {
      this.view._rangeFilter.set({ min: undefined, max: undefined }, { unset: true });
      spyOn(this.view, '_resetFilterInDI');
      this.view._initBinds();
      this.view._onFilterChanged();

      expect(this.view._resetFilterInDI).toHaveBeenCalled();
    });

    it('should not call _resetFilterInDI if filter have min or max', function () {
      this.view._rangeFilter.set({ min: 10, max: 50 });
      spyOn(this.view, '_resetFilterInDI');
      this.view._initBinds();
      this.view._onFilterChanged();

      expect(this.view._resetFilterInDI).not.toHaveBeenCalled();
    });
  });

  describe('_resetFilterInDI', function () {
    beforeEach(function () {
      this.view._rangeFilter.set({ min: 33, max: 77 });
      this.view._chartView = {
        removeSelection: function () {}
      };
      spyOn(this.view._chartView, 'removeSelection');
      this.view._initBinds();
      this.view._resetFilterInDI();
    });

    it('should call _chartView.removeSelection()', function () {
      expect(this.view._chartView.removeSelection).toHaveBeenCalled();
    });

    it('should set _timeSeriesModel lo_index and hi_index to undefined', function () {
      expect(this.view._timeSeriesModel.get('lo_index')).toEqual(undefined);
      expect(this.view._timeSeriesModel.get('hi_index')).toEqual(undefined);
    });
  });

  describe('._getChartType', function () {
    it('should return time- plus the dataview column type', function () {
      var chartType = this.view._getChartType();

      expect(chartType).toEqual('time-date');
    });
  });
});
