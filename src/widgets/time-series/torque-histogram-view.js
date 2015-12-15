var $ = require('jquery')
var View = require('cartodb.js').core.View
var HistogramChartView = require('../histogram/chart')
var TorqueTimeSliderView = require('./torque-time-slider-view')

/**
 * Torque time-series histogram view.
 * Extends the common histogram chart view with time-control
 * this.model is a histogram model
 */
module.exports = View.extend({
  className: 'CDB-Widget-content CDB-Widget-content--timeSeries',

  // TODO could be calculated from element styles instead of duplicated numbers here?
  defaults: {
    mobileThreshold: 960, // px; should match CSS media-query
    histogramChartHeight: 48 + // inline bars height
      4 + // bottom margin
      16 + // bottom labels
      4, // margins
    histogramChartMobileHeight: 20 + // inline bars height (no bottom labels)
      4 // margins
  },

  initialize: function () {
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required')
    if (!this.options.rangeFilter) throw new Error('rangeFilter is required')

    this._rangeFilter = this.options.rangeFilter
    this._torqueLayerModel = this.options.torqueLayerModel

    this.model.bind('change:data', this._onChangeData, this)
  },

  render: function () {
    this.clearSubViews()
    this._createHistogramView()
    return this
  },

  _createHistogramView: function () {
    this._chartView = new HistogramChartView({
      type: 'time',
      animationSpeed: 100,
      animationBarDelay: function (d, i) {
        return (i * 3)
      },
      margin: {
        top: 4,
        right: 4,
        bottom: 4,
        left: 4
      },
      hasHandles: true,
      height: this.defaults.histogramChartHeight,
      data: this.model.getData(),
      shadowData: this.model.getData()
    })

    this.addView(this._chartView)
    this.$el.append(this._chartView.render().el)
    this._chartView.show()

    this._chartView.bind('on_brush_end', this._onBrushEnd, this)
    this._chartView.model.bind('change:width', this._onChangeChartWidth, this)
    this.add_related_model(this._chartView.model)

    var timeSliderView = new TorqueTimeSliderView({
      model: this.model, // a histogram model
      chartView: this._chartView,
      torqueLayerModel: this._torqueLayerModel
    })
    this.addView(timeSliderView)
    timeSliderView.render()
  },

  _onChangeData: function () {
    if (this._chartView) {
      this._chartView.replaceData(this.model.getData())
    }
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
    var data = this.model.getData()
    this._rangeFilter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    )
    this._torqueLayerModel.setStepsRange(loBarIndex, hiBarIndex)
  },

  _onChangeChartWidth: function () {
    var isMobileSize = $(window).width() < this.defaults.mobileThreshold

    this._chartView.toggleLabels(!isMobileSize)

    var height = isMobileSize
      ? this.defaults.histogramChartMobileHeight
      : this.defaults.histogramChartHeight
    this._chartView.model.set('height', height)
  }

})
