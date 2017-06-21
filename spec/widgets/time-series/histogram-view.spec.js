var Backbone = require('backbone');
var HistogramView = require('../../../src/widgets/time-series/histogram-view');
var HistogramChartView = require('../../../src/widgets/histogram/chart');

describe('widgets/time-series/histogram-view', function () {
  beforeEach(function () {
    this.timeSeriesModel = new Backbone.Model();
    this.timeSeriesModel.getWidgetColor = function () {};

    this.dataviewModel = new Backbone.Model();
    this.dataviewModel.filter = {};
    this.dataviewModel.getUnfilteredDataModel = function () {
      return new Backbone.Model();
    };
    this.dataviewModel.getData = function () {};

    spyOn(HistogramChartView.prototype, 'initialize');
    spyOn(HistogramChartView.prototype, 'render').and.callFake(function () {
      return {
        el: '<chart></chart>'
      };
    });

    this.view = new HistogramView({
      timeSeriesModel: this.timeSeriesModel,
      model: this.dataviewModel,
      rangeFilter: this.dataviewModel.filter,
      displayShadowBars: false,
      normalized: true
    });
  });

  describe('.initialize', function () {
    it('should set type to `time` by default', function () {
      expect(this.view._chartType).toEqual('time');
    });
  });

  describe('._initBinds', function () {
    it('should hook up events properly', function () {
      this.view.stopListening();
      this.view.model.off();
      spyOn(this.view, '_onChangeData');
      spyOn(this.view, '_onNormalizedChanged');

      this.view._initBinds();

      this.view.model.trigger('change:data');
      expect(this.view._onChangeData).toHaveBeenCalled();

      this.view._timeSeriesModel.trigger('change:normalized');
      expect(this.view._onNormalizedChanged).toHaveBeenCalled();
    });
  });

  describe('._instantiateChartView', function () {
    it('should have been called with proper values', function () {
      this.view._chartType = 'mahou';
      this.timeSeriesModel.set('normalized', true);

      this.view._instantiateChartView();

      expect(HistogramChartView.prototype.initialize).toHaveBeenCalled();
      var args = HistogramChartView.prototype.initialize.calls.mostRecent().args[0];
      expect(args.type).toEqual('mahou');
      expect(args.displayShadowBars).toBe(false);
      expect(args.normalized).toBe(true);
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
});
