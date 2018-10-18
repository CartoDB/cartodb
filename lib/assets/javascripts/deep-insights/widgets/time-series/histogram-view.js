var $ = require('jquery');
var CoreView = require('backbone/core-view');
var HistogramChartView = require('../histogram/chart');
var viewportUtils = require('../../viewport-utils');
var TipsyTooltipView = require('../../../builder/components/tipsy-tooltip-view');

/**
 * Time-series histogram view.
 */

var INLINE_BARS_HEIGHT_PX = 48;
var BOTTOM_MARGIN_PX = 4;
var LABELS_PX = 16;
var MARGINS_PX = 4;
var INLINE_BARS_HEIGHT_WITHOUT_BOTTOM_PX = 16;

module.exports = CoreView.extend({
  className: 'CDB-Chart--histogram',

  options: {
    tooltipDataAttribute: 'data-tooltip'
  },

  defaults: {
    histogramChartHeight: INLINE_BARS_HEIGHT_PX +
      BOTTOM_MARGIN_PX +
      LABELS_PX +
      MARGINS_PX,
    histogramChartMobileHeight: INLINE_BARS_HEIGHT_WITHOUT_BOTTOM_PX
  },

  initialize: function () {
    if (!this.options.dataviewModel) throw new Error('dataviewModel is required');
    if (!this.options.layerModel) throw new Error('layerModel is required');

    this._timeSeriesModel = this.options.timeSeriesModel;
    this._dataviewModel = this.options.dataviewModel;
    this._layerModel = this.options.layerModel;
    this._rangeFilter = this.options.rangeFilter;
    this._originalData = this._dataviewModel.getUnfilteredDataModel();
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
  },

  _initBinds: function () {
    this.listenTo(this._dataviewModel, 'change:data', this._onChangeData, this);
    this.listenTo(this._dataviewModel, 'change:column', this.resetFilter, this);
    this.listenTo(this._timeSeriesModel, 'change:normalized', this._onNormalizedChanged);
    this.listenTo(this._timeSeriesModel, 'change:local_timezone', this._onChangeLocalTimezone);
    this.listenTo(this._timeSeriesModel, 'forceResize', this._onForceResize);
    this.listenTo(this._rangeFilter, 'change', this._onFilterChanged);
  },

  _toggleTooltip: function (event) {
    if (!event || !event.target) {
      return this._clearTooltip();
    }

    this._showTooltip(event);
  },

  _showTooltip: function (event) {
    if (this.tooltip && event && this.tooltip.getElement() === event.target) {
      return;
    }

    this._clearTooltip();

    this.tooltip = new TipsyTooltipView({
      el: event.target,
      title: function () {
        return this._getTooltipTitle(event);
      }.bind(this),
      trigger: 'manual'
    });

    this.tooltip.showTipsy();
    this.addView(this.tooltip);
  },

  _getTooltipTitle: function (event) {
    return $(event.target).attr(this.options.tooltipDataAttribute);
  },

  _clearTooltip: function () {
    if (!this.tooltip) return;

    this.tooltip.hideTipsy();
    this.removeView(this.tooltip);
    this.tooltip = undefined;
  },

  _createHistogramView: function () {
    this._chartView = this._instantiateChartView();
    this.addView(this._chartView);
    this.$el.append(this._chartView.render().el);
    this._chartView.show();

    this.listenTo(this._chartView, 'on_brush_end', this._onBrushEnd, this);
    this.listenTo(this._chartView, 'on_reset_filter', this.resetFilter, this);
    this.listenTo(this._chartView, 'hover', this._toggleTooltip, this);
    this.listenTo(this._chartView.model, 'change:width', this._onChangeChartWidth, this);
  },

  _instantiateChartView: function () {
    return new HistogramChartView({
      type: this._getChartType(),
      chartBarColor: this._timeSeriesModel.getWidgetColor() || '#F2CC8F',
      animationSpeed: 100,
      margin: {
        top: this._getMarginTop(),
        right: 4,
        bottom: 4,
        left: this._getMarginLeft()
      },
      hasHandles: true,
      handleWidth: 8,
      hasAxisTip: true,
      animationBarDelay: function (d, i) {
        return (i * 3);
      },
      height: this.defaults.histogramChartHeight,
      dataviewModel: this._dataviewModel,
      layerModel: this._layerModel,
      data: this._dataviewModel.getData(),
      originalData: this._originalData,
      displayShadowBars: !this._timeSeriesModel.get('normalized'),
      normalized: !!this._timeSeriesModel.get('normalized'),
      widgetModel: this._timeSeriesModel,
      local_timezone: !!this._timeSeriesModel.get('local_timezone')
    });
  },

  _getChartType: function () {
    return 'time-' + this._dataviewModel.getColumnType();
  },

  _onChangeData: function () {
    if (this._chartView) {
      this._chartView.replaceData(this._dataviewModel.getData());
      this._chartView.updateXScale();
      this._chartView.updateYScale();
    }
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
    var data = this._dataviewModel.getData();
    this._rangeFilter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
    this._timeSeriesModel.set({lo_index: loBarIndex, hi_index: hiBarIndex});
  },

  _onChangeChartWidth: function () {
    var isTablet = viewportUtils.isTabletViewport();
    this._chartView.toggleLabels(!isTablet);

    var height = isTablet
      ? this.defaults.histogramChartMobileHeight : this.defaults.histogramChartHeight;

    this._chartView.model.set('height', height);
  },

  _onNormalizedChanged: function () {
    if (this._chartView) {
      this._chartView.setNormalized(this._timeSeriesModel.get('normalized'));
    }
  },

  _onChangeLocalTimezone: function () {
    this._dataviewModel.set('localTimezone', this._timeSeriesModel.get('local_timezone'));
  },

  _onForceResize: function () {
    this._chartView.forceResize();
  },

  _resetFilterInDI: function () {
    this._timeSeriesModel.set({
      min: undefined,
      max: undefined,
      lo_index: undefined,
      hi_index: undefined
    });
    this._chartView.removeSelection();
  },

  _onFilterChanged: function () {
    if (!this._rangeFilter.has('min') && !this._rangeFilter.has('max')) {
      this._resetFilterInDI();
    }
  },

  _getMarginLeft: function () {
    return 4;
  },

  _getMarginTop: function () {
    return viewportUtils.isTabletViewport() ? 0 : 4;
  }
});
