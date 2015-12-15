var Model = require('cartodb.js').core.Model
var TorqueLayerModel = require('cartodb.js/src/geo/map/torque-layer')
var HistogramModel = require('app/widgets/histogram/model')
var HistogramChartView = require('app/widgets/histogram/chart')
var TorqueTimeSliderView = require('app/widgets/time-series/torque-time-slider-view')

describe('geo/ui/widgets/time-series/torque-time-slider-view', function () {
  beforeEach(function () {
    this.model = new HistogramModel({
      bins: 256
    }, {
      filter: new Model(),
      layer: new Model()
    })
    this.torqueLayerModel = new TorqueLayerModel({
      isRunning: false,
      step: 0,
      steps: 256
    })

    this.histogramChartMargins = {
      top: 1,
      right: 2,
      bottom: 3,
      left: 4
    }
    this.chartView = new HistogramChartView({
      margin: this.histogramChartMargins,
      height: 200,
      data: [{
        start: 0,
        end: 1
      }]
    })
    this.chartView.render()
    this.chartView.model.set('width', 400)

    this.view = new TorqueTimeSliderView({
      model: this.model,
      torqueLayerModel: this.torqueLayerModel,
      chartView: this.chartView
    })
    this.renderResult = this.view.render()
  })

  it('should render ok', function () {
    expect(this.renderResult).toBe(this.view)
  })

  describe('when step changes', function () {
    describe('when is not dragging the slider', function () {
      beforeEach(function () {
        spyOn(this.view.timeSlider, 'data').and.callThrough()
        this.torqueLayerModel.set('step', 40)
      })

      it('should move the time-slider', function () {
        expect(this.view.timeSlider.data).toHaveBeenCalled()
        expect(this.view.timeSlider.data.calls.argsFor(1)[0]).toEqual([{ x: 62.5, y: 0 }])
      })
    })

    describe('when is dragging the slider', function () {
      beforeEach(function () {
        spyOn(this.view.timeSlider, 'data').and.callThrough()
        this.view.viewModel.set('isDragging', true)
        this.torqueLayerModel.set('step', 40)
      })

      it('should not change anything', function () {
        expect(this.view.timeSlider.data).not.toHaveBeenCalled()
      })
    })
  })

  describe('when stepsRange changes', function () {
    beforeEach(function () {
      spyOn(this.chartView, 'removeSelection')
      spyOn(this.chartView, 'selectRange')
    })

    describe('when range matches data bins', function () {
      beforeEach(function () {
        this.torqueLayerModel.set('stepsRange', {
          start: 0,
          end: this.model.get('bins')
        })
      })

      it('should remove selection if stepsRange matches the data bins', function () {
        expect(this.chartView.removeSelection).toHaveBeenCalled()
        expect(this.chartView.selectRange).not.toHaveBeenCalled()
      })
    })

    describe('when range is custom', function () {
      beforeEach(function () {
        this.torqueLayerModel.set('stepsRange', {
          start: 12,
          end: 21
        })
      })

      it('should set custom selection range', function () {
        expect(this.chartView.selectRange).toHaveBeenCalled()
        expect(this.chartView.selectRange.calls.argsFor(0)).toEqual([12, 21])
        expect(this.chartView.removeSelection).not.toHaveBeenCalled()
      })
    })
  })
})
