var $ = require('jquery');
var cdb = require('cartodb.js');
var HistogramChartView = require('../histogram/chart');
var TorqueTimeSliderView = require('./torque-time-slider-view');

/**
 * Torque time-series histogram view.
 * Extends the common histogram chart view with time-control
 * this._dataviewModel is a histogram model
 */
module.exports = cdb.core.View.extend({
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
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');
    if (!this.options.rangeFilter) throw new Error('rangeFilter is required');

    this._dataviewModel = this.options.dataviewModel;
    this._rangeFilter = this.options.rangeFilter;
    this._originalData = this._dataviewModel.getUnfilteredDataModel();
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._createHistogramView();
    return this;
  },

  _initBinds: function () {
    this._torqueLayerModel.bind('change:renderRange', this._onRenderRangeChanged, this);
    this._torqueLayerModel.bind('change:steps change:start change:end', this._reSelectRange, this);
    this.add_related_model(this._torqueLayerModel);
    this._dataviewModel.bind('change:data', this._onChangeData, this);
    this.add_related_model(this._dataviewModel);
  },

  _createHistogramView: function () {
    this._chartView = new HistogramChartView({
      type: 'time',
      animationSpeed: 100,
      animationBarDelay: function (d, i) {
        return (i * 3);
      },
      chartBarColorClass: 'CDB-Chart-bar--timeSeries',
      margin: {
        top: 4,
        right: 4,
        bottom: 4,
        left: 4
      },
      hasHandles: true,
      height: this.defaults.histogramChartHeight,
      data: this._dataviewModel.getData(),
      originalData: this._originalData,
      displayShadowBars: true
    });

    this.addView(this._chartView);
    this.$el.append(this._chartView.render().el);
    this._chartView.show();

    this._chartView.bind('on_brush_end', this._onBrushEnd, this);
    this._chartView.model.bind('change:width', this._onChangeChartWidth, this);
    this.add_related_model(this._chartView.model);

    var timeSliderView = new TorqueTimeSliderView({
      dataviewModel: this._dataviewModel, // a histogram model
      chartView: this._chartView,
      torqueLayerModel: this._torqueLayerModel
    });
    this.addView(timeSliderView);
    timeSliderView.render();
  },

  _onChangeData: function () {
    if (this._chartView) {
      this._chartView.replaceData(this._dataviewModel.getData());
      this._chartView.updateXScale();
      this._chartView.updateYScale();
      this._reSelectRange();
    }
  },

  _onRenderRangeChanged: function (m, r) {
    if (r.start === undefined && r.end === undefined) {
      this._chartView.removeSelection();
      this._rangeFilter.unsetRange();
    }
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
    // TODO setting range filter causes selected-range to be reset, how to fix?
    var data = this._dataviewModel.getData();
    this._rangeFilter.setRange(
       data[loBarIndex].start,
       data[hiBarIndex - 1].end
    );
    this._reSelectRange();
  },

  timeToStep: function (timestamp) {
    var steps = this._torqueLayerModel.get('steps');
    var start = this._torqueLayerModel.get('start');
    var end = this._torqueLayerModel.get('end');
    var step = (steps * (1000 * timestamp - start)) / (end - start);
    return step;
  },

  _reSelectRange: function () {
    if (!this._rangeFilter.isEmpty()) {
      var loStep = this.timeToStep(this._rangeFilter.get('min'));
      var hiStep = this.timeToStep(this._rangeFilter.get('max'));

      // clamp values since the range can be outside of the current torque thing
      var steps = this._torqueLayerModel.get('steps');
      this._torqueLayerModel.renderRange(
        this._clampRangeVal(0, steps, loStep), // start
        this._clampRangeVal(0, steps, hiStep) // end
      );
    }
  },

  _clampRangeVal: function (a, b, t) {
    return Math.max(a, Math.min(b, t));
  },

  _onChangeChartWidth: function () {
    var isMobileSize = $(window).width() < this.defaults.mobileThreshold;

    this._chartView.toggleLabels(!isMobileSize);

    var height = isMobileSize
      ? this.defaults.histogramChartMobileHeight
      : this.defaults.histogramChartHeight;
    this._chartView.model.set('height', height);
  }

});
