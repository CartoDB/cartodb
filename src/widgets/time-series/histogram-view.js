var $ = require('jquery');
var cdb = require('cartodb.js');
var HistogramChartView = require('../histogram/chart');

/**
 * Time-series histogram view.
 */
module.exports = cdb.core.View.extend({
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
    this._timeSeriesModel = this.options.timeSeriesModel;
    this._rangeFilter = this.options.rangeFilter;
    this._originalData = this.model.getUnfilteredDataModel();
    this._chartType = 'time';
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._createHistogramView();
    return this;
  },

  selectRange: function (loBarIndex, hiBarIndex) {
    this._chartView.selectRange(loBarIndex, hiBarIndex);
  },

  resetFilter: function () {
    this._rangeFilter.unsetRange();
    this._chartView.removeSelection();
    this._timeSeriesModel.set({lo_index: null, hi_index: null});
  },

  _initBinds: function () {
    this.model.bind('change:data', this._onChangeData, this);
    this.listenTo(this._timeSeriesModel, 'change:normalized', this._onNormalizedChanged);
  },

  _createHistogramView: function () {
    this._chartView = this._instantiateChartView();
    this.addView(this._chartView);
    this.$el.append(this._chartView.render().el);
    this._chartView.show();

    this._chartView.bind('on_brush_end', this._onBrushEnd, this);
    this._chartView.model.bind('change:width', this._onChangeChartWidth, this);
    this.add_related_model(this._chartView.model);
  },

  _instantiateChartView: function () {
    return new HistogramChartView({
      type: this._chartType,
      chartBarColor: this._timeSeriesModel.getWidgetColor() || '#F2CC8F',
      animationSpeed: 100,
      margin: {
        top: 4,
        right: 4,
        bottom: 4,
        left: 4
      },
      hasHandles: true,
      handleWidth: 10,
      hasAxisTip: true,
      animationBarDelay: function (d, i) {
        return (i * 3);
      },
      height: this.defaults.histogramChartHeight,
      data: this.model.getData(),
      originalData: this._originalData,
      displayShadowBars: !this._timeSeriesModel.get('normalized'),
      normalized: !!this._timeSeriesModel.get('normalized'),
      widgetModel: this._timeSeriesModel
    });
  },

  _onChangeData: function () {
    if (this._chartView) {
      this._chartView.replaceData(this.model.getData());
      this._chartView.updateXScale();
      this._chartView.updateYScale();
    }
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
    var data = this.model.getData();
    this._rangeFilter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
    this._timeSeriesModel.set({lo_index: loBarIndex, hi_index: hiBarIndex});
  },

  _onChangeChartWidth: function () {
    var isMobileSize = $(window).width() < this.defaults.mobileThreshold;

    this._chartView.toggleLabels(!isMobileSize);

    var height = isMobileSize
      ? this.defaults.histogramChartMobileHeight
      : this.defaults.histogramChartHeight;
    this._chartView.model.set('height', height);
  },

  _onNormalizedChanged: function () {
    if (this._chartView) {
      this._chartView.setNormalized(this._timeSeriesModel.get('normalized'));
    }
  }
});
