var $ = require('jquery');
var cdb = require('cartodb.js');
var HistogramChartView = require('../histogram/chart');
var TimeSeriesHeaderView = require('./time-series-header-view');

/**
 * Time-series histogram view.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-content CDB-Widget-content--timeSeries',

  defaults: {
    mobileThreshold: 960, // px; should match CSS media-query
    histogramChartHeight: 48 + // inline bars height
      4 + // bottom margin
      16 + // labels
      4, // margins
    histogramChartMobileHeight: 20 + // inline bars height (no bottom labels)
      4 // margins
  },

  initialize: function () {
    this._rangeFilter = this.options.rangeFilter;
    this._originalData = this.model.getUnfilteredDataModel();
    this.model.bind('change:data', this._onChangeData, this);
  },

  render: function () {
    this.clearSubViews();
    this._createHeaderView();
    this._createHistogramView();
    return this;
  },

  _createHeaderView: function () {
    var headerView = new TimeSeriesHeaderView({
      dataviewModel: this.model,
      rangeFilter: this._rangeFilter
    });
    headerView.bind('resetFilter', this._onResetFilter, this);
    this.addView(headerView);
    this.$el.append(headerView.render().el);
  },

  _createHistogramView: function () {
    this._chartView = new HistogramChartView({
      type: 'time',
      chartBarColorClass: 'CDB-Chart-bar--timeSeries',
      animationSpeed: 100,
      margin: {
        top: 4,
        right: 4,
        bottom: 4,
        left: 4
      },
      hasHandles: true,
      animationBarDelay: function (d, i) {
        return (i * 3);
      },
      height: this.defaults.histogramChartHeight,
      data: this.model.getData(),
      originalData: this._originalData,
      displayShadowBars: true
    });
    this.addView(this._chartView);
    this.$el.append(this._chartView.render().el);
    this._chartView.show();

    this._chartView.bind('on_brush_end', this._onBrushEnd, this);
    this._chartView.model.bind('change:width', this._onChangeChartWidth, this);
    this.add_related_model(this._chartView.model);
  },

  _onChangeData: function () {
    if (this._chartView) {
      this._chartView.replaceData(this.model.getData());
      this._chartView.updateXScale();
      this._chartView.updateYScale();
    }
  },

  _onResetFilter: function () {
    this._rangeFilter.unsetRange();
    this._chartView.removeSelection();
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
    var data = this.model.getData();
    this._rangeFilter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
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
