var _ = require('underscore');
var Backbone = require('backbone');
var specHelper = require('../../spec-helper');
var HistogramChartView = require('../../../src/widgets/histogram/chart');
var TorqueTimeSliderView = require('../../../src/widgets/time-series/torque-time-slider-view');
var formatter = require('../../../src/formatter');
var TorqueLayer = require('cartodb.js/src/geo/map/torque-layer');

describe('widgets/time-series/torque-time-slider-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.layerModel = vis.map.layers.first();
    var source = vis.analysis.findNodeById('a0');
    this.dataviewModel = vis.dataviews.createHistogramModel({
      aggregation: 'minute',
      offset: 0,
      column: 'dates',
      bins: 256,
      source: source
    });
    // Assume start/end are set for the test env
    this.dataviewModel.set({
      start: 0,
      end: 1
    });
    this.torqueLayerModel = new TorqueLayer({
      isRunning: false,
      step: 0,
      steps: 256,
      start: 0,
      end: 1000
    }, {
      engine: vis.getEngine()
    });

    this.histogramChartMargins = {
      top: 4,
      right: 4,
      bottom: 4,
      left: 4
    };

    spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');

    this.chartView = new HistogramChartView({
      type: 'time-series',
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel,
      margin: this.histogramChartMargins,
      height: 72,
      data: [{
        start: 0,
        end: 1
      }]
    });
    this.chartView.render();
    this.chartView.model.set('width', 400);

    this.timeSeriesModel = new Backbone.Model({
      local_timezone: false
    });

    this.view = new TorqueTimeSliderView({
      dataviewModel: this.dataviewModel,
      torqueLayerModel: this.torqueLayerModel,
      chartView: this.chartView,
      timeSeriesModel: this.timeSeriesModel
    });
  });

  describe('.render', function () {
    it('should render ok', function () {
      this.view.render();

      expect(this.view._chartView.$('.CDB-TimeSlider').length).toBe(1);
    });

    describe('tablet', function () {
      var view;

      beforeEach(function () {
        view = new TorqueTimeSliderView({
          dataviewModel: this.dataviewModel,
          torqueLayerModel: this.torqueLayerModel,
          chartView: this.chartView,
          timeSeriesModel: this.timeSeriesModel
        });
        spyOn(view, '_generateTimeSliderTip');

        view._isTabletViewport = function () {
          return true;
        };
      });

      it('should render timeslider tip', function () {
        view.render();

        expect(view._generateTimeSliderTip).toHaveBeenCalled();
      });
    });
  });

  describe('._generateTimeSliderTip', function () {
    beforeEach(function () {
      this.view._chartView.model.set({
        height: 16,
        margin: _.extend({}, this.view._chartView.model.get('margin'), { top: 0 }),
        showLabels: false
      }, { silent: true });

      this.view._isTabletViewport = function () {
        return true;
      };

      this.view.render();
    });

    it('should generate timeslider tip', function () {
      var timesliderTip = this.view._chartView.$('.CDB-Chart-timeSliderTip');

      expect(timesliderTip.length).toBe(1);
      expect(timesliderTip.attr('transform')).toBe('translate(16,15)');
    });
  });

  describe('._updateTimeSliderTip', function () {
    var time = '2017-07-30T06:56:23Z';

    beforeEach(function () {
      this.view._chartView.model.set({
        height: 16,
        margin: _.extend({}, this.view._chartView.model.get('margin'), { top: 0 }),
        showLabels: false
      }, { silent: true });

      this.view._isTabletViewport = function () {
        return true;
      };

      this.view.render();
    });

    it('should update timeslider tip', function () {
      this.torqueLayerModel.set({
        step: 40
      });
      this.view._updateTimeSliderTip();

      expect(this.view._chartView.$('.CDB-Chart-timeSliderTipText').text()).toBe('0');
    });

    describe('datetime', function () {
      beforeEach(function () {
        this.view._isDateTimeSeries = function () {
          return true;
        };
        this.view._createFormatter();
      });

      it('should update timeslider tip', function () {
        this.torqueLayerModel.set({
          time: time
        });
        this.view._updateTimeSliderTip();

        expect(this.view._chartView.$('.CDB-Chart-timeSliderTipText').text()).toBe('06:56 - Jul 30th, 2017');
      });
    });
  });

  describe('._onChangeChartHeight', function () {
    describe('tablet', function () {
      beforeEach(function () {
        this.view._chartView.model.set({
          height: 16,
          margin: _.extend({}, this.view._chartView.model.get('margin'), { top: 0 }),
          showLabels: false
        }, { silent: true });

        this.view._isTabletViewport = function () {
          return true;
        };

        this.view.render();
      });

      it('should update time-slider height', function () {
        this.view._onChangeChartHeight();

        expect(this.view._chartView.$('.CDB-TimeSlider').attr('height')).toBe('13');
      });
    });
  });

  describe('._onChangeTime', function () {
    describe('filter', function () {
      beforeEach(function () {
        this.view._dataviewModel.filter.isEmpty = function () {
          return false;
        };
      });

      it('should remove time-slider tip', function () {
        spyOn(this.view, '_removeTimeSliderTip');
        this.view.render();

        this.view._onChangeTime();

        expect(this.view._removeTimeSliderTip).toHaveBeenCalled();
      });
    });

    describe('empty filter, tablet', function () {
      beforeEach(function () {
        this.view._isTabletViewport = function () {
          return true;
        };
      });

      it('should generate and update time-slider tip', function () {
        spyOn(this.view, '_generateTimeSliderTip');
        spyOn(this.view, '_updateTimeSliderTip');
        this.view.render();

        this.view._onChangeTime();

        expect(this.view._generateTimeSliderTip).toHaveBeenCalled();
        expect(this.view._updateTimeSliderTip).toHaveBeenCalled();
      });

      describe('timeslider tip exists', function () {
        it('should not create time-slider tip', function () {
          spyOn(this.view, '_generateTimeSliderTip').and.callThrough();
          this.view.render();

          this.view._onChangeTime();

          expect(this.view._generateTimeSliderTip).toHaveBeenCalled();
        });
      });
    });
  });

  describe('._removeTimeSliderTip', function () {
    it('should remove timeslider tip', function () {
      this.view.render();

      this.view._removeTimeSliderTip();

      expect(this.view._chartView.$('.CDB-Chart-timeSliderTip').length).toBe(0);
    });
  });

  describe('._createFormatter', function () {
    var view;
    var dataviewModel;

    beforeEach(function () {
      spyOn(formatter, 'timestampFactory');

      dataviewModel = new cdb.core.Model({
        aggregation: 'minute',
        offset: 0
      });
      dataviewModel.layer = new cdb.core.Model();
      dataviewModel.getColumnType = function () {
        return 'number';
      };

      view = new TorqueTimeSliderView({
        dataviewModel: dataviewModel,
        torqueLayerModel: this.torqueLayerModel,
        chartView: this.chartView,
        timeSeriesModel: this.timeSeriesModel
      });
    });

    it('should setup formatter', function () {
      view._createFormatter();

      expect(formatter.timestampFactory).not.toHaveBeenCalledWith();
      expect(view.formatter).toBe(formatter.formatNumber);
    });

    describe('datetime', function () {
      it('should setup formatter', function () {
        view._isDateTimeSeries = function () {
          return true;
        };

        view._createFormatter();

        expect(formatter.timestampFactory).toHaveBeenCalledWith('minute', 0, false);
        expect(view.formatter).not.toBe(formatter.formatNumber);
      });
    });
  });

  describe('._onChangeStep', function () {
    beforeEach(function () {
      this.view.render();
    });

    describe('when is not dragging the slider', function () {
      beforeEach(function () {
        spyOn(this.view.timeSlider, 'data').and.callThrough();
        this.torqueLayerModel.set('step', 40);
      });

      it('should move the time-slider', function () {
        expect(this.view.timeSlider.data).toHaveBeenCalled();
        expect(this.view.timeSlider.data.calls.argsFor(1)[0]).toEqual([{ x: 65.25, y: 0 }]);
      });
    });

    describe('when is dragging the slider', function () {
      beforeEach(function () {
        spyOn(this.view.timeSlider, 'data').and.callThrough();
        this.view.model.set('isDragging', true);
        this.torqueLayerModel.set('step', 40);
      });

      it('should not change anything', function () {
        expect(this.view.timeSlider.data).not.toHaveBeenCalled();
      });
    });
  });

  describe('when apply filter', function () {
    beforeEach(function () {
      this.dataviewModel.filter.setRange(1, 2);
    });

    it('should hide view', function () {
      expect(this.view.el.style.display).toEqual('none');
    });

    describe('when filter is cleared', function () {
      beforeEach(function () {
        this.dataviewModel.filter.unsetRange();
      });

      it('should show view', function () {
        expect(this.view.el.style.display).not.toEqual('none');
      });
    });
  });

  describe('._onLocalTimezoneChanged', function () {
    it('should upate formatter and timeslider tip', function () {
      spyOn(this.view, '_createFormatter');
      spyOn(this.view, '_updateTimeSliderTip');

      this.view._onLocalTimezoneChanged();

      expect(this.view._createFormatter).toHaveBeenCalled();
      expect(this.view._updateTimeSliderTip).toHaveBeenCalled();
    });
  });

  describe('.clean', function () {
    beforeEach(function () {
      this.view.render();
      this.chartView.$el.appendTo('body');

      // Precheck, inverted assertions used below
      expect(document.body.contains(this.view.el)).toBe(true);
      expect(this.chartView.el.contains(this.view.el)).toBe(true);

      this.view.clean();
    });

    afterEach(function () {
      this.chartView.clean();
    });

    it('should remove the element from the chart view', function () {
      expect(this.chartView.el.contains(this.view.el)).toBe(false);
    });

    it('should remove the element from the DOM', function () {
      expect(document.body.contains(this.view.el)).toBe(false);
    });
  });
});
