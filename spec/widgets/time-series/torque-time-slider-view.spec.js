var specHelper = require('../../spec-helper');
var HistogramChartView = require('../../../src/widgets/histogram/chart');
var TorqueTimeSliderView = require('../../../src/widgets/time-series/torque-time-slider-view');

describe('widgets/time-series/torque-time-slider-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      column: 'dates',
      bins: 256
    });
    // Assume start/end are set for the test env
    this.dataviewModel.set({
      start: 0,
      end: 1
    });
    this.torqueLayerModel = new cdb.geo.TorqueLayer({
      isRunning: false,
      step: 0,
      steps: 256,
      start: 0,
      end: 1000
    });

    this.histogramChartMargins = {
      top: 1,
      right: 2,
      bottom: 3,
      left: 4
    };
    this.chartView = new HistogramChartView({
      margin: this.histogramChartMargins,
      height: 200,
      data: [{
        start: 0,
        end: 1
      }]
    });
    this.chartView.render();
    this.chartView.model.set('width', 400);

    this.view = new TorqueTimeSliderView({
      dataviewModel: this.dataviewModel,
      torqueLayerModel: this.torqueLayerModel,
      chartView: this.chartView
    });
    this.renderResult = this.view.render();
  });

  it('should render ok', function () {
    expect(this.renderResult).toBe(this.view);
  });

  describe('when step changes', function () {
    describe('when is not dragging the slider', function () {
      beforeEach(function () {
        spyOn(this.view.timeSlider, 'data').and.callThrough();
        this.torqueLayerModel.set('step', 40);
      });

      it('should move the time-slider', function () {
        expect(this.view.timeSlider.data).toHaveBeenCalled();
        expect(this.view.timeSlider.data.calls.argsFor(1)[0]).toEqual([{ x: 62.5, y: 0 }]);
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

  describe('.clean', function () {
    beforeEach(function () {
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
