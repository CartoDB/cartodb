var _ = require('underscore');
var CoreView = require('backbone/core-view');
var formatter = require('../../formatter');
var HistogramTitleView = require('./histogram-title-view');
var HistogramChartView = require('./chart');
var placeholder = require('./placeholder.tpl');
var template = require('./content.tpl');
var DropdownView = require('../dropdown/widget-dropdown-view');
var TipsyTooltipView = require('../../../builder/components/tipsy-tooltip-view');
var AnimateValues = require('../animate-values.js');
var animationTemplate = require('./animation-template.tpl');
var layerColors = require('../../util/layer-colors');
var analyses = require('../../data/analyses');
var escapeHTML = require('../../util/escape-html');

var TABLET_VIEWPORT_BREAKPOINT = 1200;

/**
 * Widget content view for a histogram
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-body',

  defaults: {
    chartHeight: 48 + 20 + 4
  },

  events: {
    'click .js-clear': '_resetWidget',
    'click .js-zoom': '_zoom'
  },

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._layerModel = this.model.layerModel;
    this._originalData = this._dataviewModel.getUnfilteredDataModel();
    this.filter = this._dataviewModel.filter;
    this.lockedByUser = false;
    this._numberOfFilters = 0;
    this._initStateApplied = false;

    if (this._originalData.get('hasBeenFetched')) {
      this._initBinds();
    } else {
      this.listenToOnce(this._originalData, 'change:hasBeenFetched', function () {
        this._initBinds();
      });
    }

    window.addEventListener('resize', this._onWindowResized.bind(this), { passive: true });
  },

  render: function () {
    this.clearSubViews();
    this._unbinds();

    this.$el.toggleClass('is-collapsed', !!this.model.get('collapsed'));

    var data = this._dataviewModel.getData();
    var hasNulls = this._dataviewModel.hasNulls();
    var originalData = this._originalData.getData();
    var isDataEmpty = !_.size(data) && !_.size(originalData);

    var sourceId = this._dataviewModel.get('source').id;
    var letter = layerColors.letter(sourceId);
    var sourceColor = layerColors.getColorForLetter(letter);
    var sourceType = this._dataviewModel.getSourceType() || '';
    var isSourceType = this._dataviewModel.isSourceType();
    var layerName = isSourceType
      ? this.model.get('table_name')
      : this._layerModel.get('layer_name');

    this.$el.html(
      template({
        title: this.model.get('title'),
        sourceId: sourceId,
        sourceType: analyses.title(sourceType),
        isSourceType: isSourceType,
        showStats: this.model.get('show_stats'),
        showNulls: hasNulls,
        showSource: this.model.get('show_source') && letter !== '',
        itemsCount: !isDataEmpty ? data.length : '-',
        isCollapsed: !!this.model.get('collapsed'),
        sourceColor: sourceColor,
        layerName: escapeHTML(layerName)
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
      this._initTitleView();
    } else {
      this._setupBindings();
      this._initViews();
    }

    return this;
  },

  _initViews: function () {
    this._initTitleView();
    this._initDropdownView();
    this._renderMiniChart();
    this._renderMainChart();
    this._renderAllValues();
  },

  _onWindowResized: function () {
    if (window.innerWidth < TABLET_VIEWPORT_BREAKPOINT) {
      this.histogramChartView && this.histogramChartView.forceResize();
    }
  },

  _initDropdownView: function () {
    var dropdown = new DropdownView({
      model: this.model,
      target: '.js-actions',
      container: this.$('.js-header'),
      flags: {
        normalizeHistogram: true
      }
    });

    this.addView(dropdown);
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
      title: 'data-tooltip',
      trigger: 'manual'
    });

    this.tooltip.showTipsy();
    this.addView(this.tooltip);
  },

  _clearTooltip: function () {
    if (!this.tooltip) return;

    this.tooltip.hideTipsy();
    this.removeView(this.tooltip);
    this.tooltip = undefined;
  },

  _initTitleView: function () {
    var titleView = new HistogramTitleView({
      widgetModel: this.model,
      dataviewModel: this._dataviewModel,
      layerModel: this._layerModel
    });

    this.$('.js-title').append(titleView.render().el);
    this.addView(titleView);
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:collapsed', this.render);
    this.listenTo(this.model, 'change:normalized', this._onNormalizedChanged);

    if (this.model.get('hasInitialState') === true) {
      this._setInitialState();
    } else {
      this.listenTo(this.model, 'change:hasInitialState', this._setInitialState);
    }

    this.listenTo(this._layerModel, 'change:layer_name', this.render);
  },

  _setInitialState: function () {
    var data = this._dataviewModel.getData();
    if (data.length === 0) {
      this._dataviewModel.once('change:data', this._onInitialState, this);
    } else {
      this._onInitialState();
    }
  },

  _onNormalizedChanged: function () {
    var normalized = this.model.get('normalized');
    this.histogramChartView.setNormalized(normalized);
    this.miniHistogramChartView.setNormalized(normalized);
  },

  _onInitialState: function () {
    this.add_related_model(this._dataviewModel);
    this.render();

    if (this.model.get('autoStyle') === true) {
      this.model.autoStyle();
    }

    if (this._hasRange()) {
      this._numberOfFilters = 1;
    }

    // in order to calculate the stats right, we simulate the full zommmed range
    if (this._isZoomed()) {
      this._numberOfFilters = 2;
    }

    if (this._numberOfFilters !== 0) {
      this._setInitialRange();
    } else {
      this._completeInitialState();
    }
  },

  _setupRange: function (data, min, max, updateCallback) {
    var lo = 0;
    var hi = data.length;
    var startMin;
    var startMax;

    if (_.isNumber(min)) {
      startMin = _.findWhere(data, {start: min});
      lo = startMin ? startMin.bin : 0;
    }

    if (_.isNumber(max)) {
      startMax = _.findWhere(data, {end: max});
      hi = startMax ? startMax.bin + 1 : data.length;
    }

    if ((lo && lo !== 0) || (hi && hi !== data.length)) {
      this.filter.setRange(
        data[lo].start,
        data[hi - 1].end
      );
      this._onChangeFilterEnabled();
      this.histogramChartView.selectRange(lo, hi);
    }

    updateCallback && updateCallback(lo, hi);
  },

  _setInitialRange: function () {
    var data = this._dataviewModel.getData();
    var min = this.model.get('min');
    var max = this.model.get('max');
    var filterEnabled = (min !== undefined || max !== undefined);

    this._setupRange(data, min, max, function (lo, hi) {
      this.model.set({ filter_enabled: filterEnabled, lo_index: lo, hi_index: hi });
      this._dataviewModel.bind('change:data', this._onHistogramDataChanged, this);
      this._initStateApplied = true;

      // If zoomed, we open the zoom level. Internally it does a fetch, so a change:data is triggered
      // and the _onHistogramDataChanged callback will do the _updateStats call.
      if (this._isZoomed()) {
        this._onChangeZoomEnabled();
        this._onZoomIn();
      } else {
        this._updateStats();
      }
    }.bind(this));
  },

  _completeInitialState: function () {
    this._dataviewModel.bind('change:data', this._onHistogramDataChanged, this);
    this._initStateApplied = true;
    this._updateStats();
  },

  _isZoomed: function () {
    return this.model.get('zoomed');
  },

  _hasRange: function () {
    var min = this.model.get('min');
    var max = this.model.get('max');

    return (min != null || max != null);
  },

  _onHistogramDataChanged: function () {
    // When the histogram is zoomed, we don't need to rely
    // on the change url to update the histogram
    // TODO the widget should not know about the URL… could this state be got from the dataview model somehow?
    if (this._dataviewModel.changed.url && this._isZoomed()) {
      return;
    }

    // if the action was initiated by the user
    // don't replace the stored data
    if (this.lockedByUser) {
      this.lockedByUser = false;
    } else {
      if (!this._isZoomed()) {
        this.histogramChartView.showShadowBars();
        this.miniHistogramChartView.replaceData(this._dataviewModel.getData());
      } else {
        this._filteredData = this._dataviewModel.getData();
      }
      this.histogramChartView.replaceData(this._dataviewModel.getData());
    }

    if (this.unsettingRange) {
      this._unsetRange();
    }

    this._updateStats();
  },

  _unsetRange: function () {
    this.unsettingRange = false;
    this.histogramChartView.replaceData(this._dataviewModel.getData());
    this.model.set({ lo_index: null, hi_index: null });

    if (!this._isZoomed()) {
      this.histogramChartView.showShadowBars();
    }
  },

  _addPlaceholder: function () {
    this.$('.js-content').append(placeholder());
  },

  _renderMainChart: function () {
    this.histogramChartView = new HistogramChartView(({
      type: 'histogram',
      margin: { top: 4, right: 4, bottom: 4, left: 4 },
      hasHandles: true,
      hasAxisTip: true,
      chartBarColor: this.model.getColor() || '#9DE0AD',
      width: this.canvasWidth,
      height: this.defaults.chartHeight,
      data: this._dataviewModel.getData(),
      dataviewModel: this._dataviewModel,
      layerModel: this._layerModel,
      originalData: this._originalData,
      displayShadowBars: !this.model.get('normalized'),
      normalized: this.model.get('normalized'),
      widgetModel: this.model
    }));

    this.$('.js-chart').append(this.histogramChartView.el);
    this.addView(this.histogramChartView);

    this.histogramChartView.bind('on_brush_end', this._onBrushEnd, this);
    this.histogramChartView.bind('hover', this._toggleTooltip, this);
    this.histogramChartView.render().show();

    this._updateStats();
  },

  _renderMiniChart: function () {
    this.miniHistogramChartView = new HistogramChartView(({
      type: 'histogram',
      className: 'CDB-Chart--mini',
      mini: true,
      margin: { top: 0, right: 4, bottom: 4, left: 4 },
      height: 40,
      showOnWidthChange: false,
      dataviewModel: this._dataviewModel,
      layerModel: this._layerModel,
      data: this._dataviewModel.getData(),
      normalized: this.model.get('normalized'),
      chartBarColor: this.model.getColor() || '#9DE0AD',
      originalData: this._originalData,
      widgetModel: this.model
    }));

    this.addView(this.miniHistogramChartView);
    this.$('.js-mini-chart').append(this.miniHistogramChartView.el);
    this.miniHistogramChartView.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniHistogramChartView.render();
  },

  _setupBindings: function () {
    this._dataviewModel.bind('change:bins', this._onChangeBins, this);
    this.model.bind('change:zoomed', this._onChangeZoomed, this);
    this.model.bind('change:zoom_enabled', this._onChangeZoomEnabled, this);
    this.model.bind('change:filter_enabled', this._onChangeFilterEnabled, this);
    this.model.bind('change:total', this._onChangeTotal, this);
    this.model.bind('change:nulls', this._onChangeNulls, this);
    this.model.bind('change:max', this._onChangeMax, this);
    this.model.bind('change:min', this._onChangeMin, this);
    this.model.bind('change:avg', this._onChangeAvg, this);
  },

  _unbinds: function () {
    this._dataviewModel.off('change:bins', this._onChangeBins, this);
    this.model.off('change:zoomed', this._onChangeZoomed, this);
    this.model.off('change:zoom_enabled', this._onChangeZoomEnabled, this);
    this.model.off('change:filter_enabled', this._onChangeFilterEnabled, this);
    this.model.off('change:total', this._onChangeTotal, this);
    this.model.off('change:nulls', this._onChangeNulls, this);
    this.model.off('change:max', this._onChangeMax, this);
    this.model.off('change:min', this._onChangeMin, this);
    this.model.off('change:avg', this._onChangeAvg, this);
  },

  _onMiniRangeUpdated: function (loBarIndex, hiBarIndex) {
    this.lockedByUser = false;

    this._clearTooltip();
    this.histogramChartView.removeSelection();

    var data = this._originalData.getData();

    this.model.set({lo_index: loBarIndex, hi_index: hiBarIndex, zlo_index: null, zhi_index: null});
    this._applyBrushFilter(data, loBarIndex, hiBarIndex);
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
    if (this._isZoomed()) {
      this._onBrushEndFiltered(loBarIndex, hiBarIndex);
    } else {
      this._onBrushEndUnfiltered(loBarIndex, hiBarIndex);
    }
  },

  _onBrushEndFiltered: function (loBarIndex, hiBarIndex) {
    var data = this._filteredData;
    if ((!data || !data.length) || (this.model.get('zlo_index') === loBarIndex && this.model.get('zhi_index') === hiBarIndex)) {
      return;
    }

    this._numberOfFilters = 2;
    this.lockedByUser = true;
    this.model.set({filter_enabled: true, zlo_index: loBarIndex, zhi_index: hiBarIndex});
    this._applyBrushFilter(data, loBarIndex, hiBarIndex);
  },

  _onBrushEndUnfiltered: function (loBarIndex, hiBarIndex) {
    var data = this._dataviewModel.getData();
    if ((!data || !data.length) || (this.model.get('lo_index') === loBarIndex && this.model.get('hi_index') === hiBarIndex)) {
      return;
    }
    this._numberOfFilters = 1;
    this.model.set({filter_enabled: true, zoom_enabled: true, lo_index: loBarIndex, hi_index: hiBarIndex});
    this._applyBrushFilter(data, loBarIndex, hiBarIndex);
  },

  _applyBrushFilter: function (data, loBarIndex, hiBarIndex) {
    if (loBarIndex !== hiBarIndex && loBarIndex >= 0 && loBarIndex < data.length && (hiBarIndex - 1) >= 0 && (hiBarIndex - 1) < data.length) {
      this.filter.setRange(
        data[loBarIndex].start,
        data[hiBarIndex - 1].end
      );
      this._updateStats();
    } else {
      console.error('Error accessing array bounds', loBarIndex, hiBarIndex, data);
    }
  },

  _onChangeFilterEnabled: function () {
    this.$('.js-filter').toggleClass('is-hidden', !this.model.get('filter_enabled'));
  },

  _onChangeBins: function (mdl, bins) {
    this._resetWidget();
  },

  _onChangeZoomEnabled: function () {
    this.$('.js-zoom').toggleClass('is-hidden', !this.model.get('zoom_enabled'));
  },

  _renderAllValues: function () {
    this._changeHeaderValue('.js-nulls', 'nulls', '');
    this._changeHeaderValue('.js-val', 'total', 'SELECTED');
    this._changeHeaderValue('.js-max', 'max', '');
    this._changeHeaderValue('.js-min', 'min', '');
    this._changeHeaderValue('.js-avg', 'avg', '');
  },

  _changeHeaderValue: function (className, what, suffix) {
    if (this.model.get(what) == null) {
      this.$(className).text('0 ' + suffix);
      return;
    }

    this._addTitleForValue(className, what, suffix);

    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateValue(this.model, what, className, animationTemplate, {
      formatter: formatter.formatNumber,
      templateData: { suffix: ' ' + suffix }
    });
  },

  _onChangeNulls: function () {
    this._changeHeaderValue('.js-nulls', 'nulls', '');
  },

  _onChangeTotal: function () {
    this._changeHeaderValue('.js-val', 'total', 'SELECTED');
  },

  _onChangeMax: function () {
    this._changeHeaderValue('.js-max', 'max', '');
  },

  _onChangeMin: function () {
    this._changeHeaderValue('.js-min', 'min', '');
  },

  _onChangeAvg: function () {
    this._changeHeaderValue('.js-avg', 'avg', '');
  },

  _addTitleForValue: function (className, what, unit) {
    this.$(className).attr('title', this._formatNumberWithCommas(this.model.get(what).toFixed(2)) + ' ' + unit);
  },

  _formatNumberWithCommas: function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  _calculateBars: function (data) {
    var min;
    var max;
    var loBarIndex;
    var hiBarIndex;
    var startMin;
    var startMax;

    if (this._isZoomed() && this._numberOfFilters === 2) {
      min = this.model.get('zmin');
      max = this.model.get('zmax');
      loBarIndex = this.model.get('zlo_index');
      hiBarIndex = this.model.get('zhi_index');
    } else if (this._numberOfFilters === 1) {
      min = this.model.get('min');
      max = this.model.get('max');
      loBarIndex = this.model.get('lo_index');
      hiBarIndex = this.model.get('hi_index');
    }

    if (data.length > 0) {
      if (!_.isNumber(min) && !_.isNumber(loBarIndex)) {
        loBarIndex = 0;
      } else if (_.isNumber(min) && !_.isNumber(loBarIndex)) {
        startMin = _.findWhere(data, {start: min});
        loBarIndex = (startMin && startMin.bin) || 0;
      }

      if (!_.isNumber(max) && !_.isNumber(hiBarIndex)) {
        hiBarIndex = data.length;
      } else if (_.isNumber(max) && !_.isNumber(hiBarIndex)) {
        startMax = _.findWhere(data, {end: max});
        hiBarIndex = (startMax && startMax.bin + 1) || data.length;
      }
    } else {
      loBarIndex = 0;
      hiBarIndex = data.length;
    }

    return {
      loBarIndex: loBarIndex,
      hiBarIndex: hiBarIndex
    };
  },

  _updateStats: function () {
    if (!this._initStateApplied) return;
    var data;

    if (!this._isZoomed() || (this._isZoomed() && this._numberOfFilters === 2)) {
      data = this.histogramChartView.model.get('data');
    } else {
      data = this.miniHistogramChartView.model.get('data');
    }

    if (data == null) {
      return;
    }

    var nulls = this._dataviewModel.get('nulls');
    var bars = this._calculateBars(data);
    var loBarIndex = bars.loBarIndex;
    var hiBarIndex = bars.hiBarIndex;
    var sum, avg, min, max;
    var attrs;

    if (data && data.length) {
      sum = this._calcSum(data, loBarIndex, hiBarIndex);
      avg = this._calcAvg(data, loBarIndex, hiBarIndex);

      if (loBarIndex >= 0 && loBarIndex < data.length) {
        min = data[loBarIndex].start;
      }

      if (hiBarIndex >= 0 && hiBarIndex - 1 < data.length) {
        max = data[Math.max(0, hiBarIndex - 1)].end;
      }

      if (this._isZoomed() && this._numberOfFilters === 2) {
        attrs = {zmin: min, zmax: max, zlo_index: loBarIndex, zhi_index: hiBarIndex};
      } else if (!this._isZoomed() && this._numberOfFilters === 1) {
        attrs = {min: min, max: max, lo_index: loBarIndex, hi_index: hiBarIndex};
      }

      attrs = _.extend(
        { total: sum, nulls: nulls, avg: avg },
        attrs);

      this.model.set(attrs);
    }
  },

  _calcAvg: function (data, start, end) {
    var selectedData = data.slice(start, end);

    var total = this._calcSum(data, start, end);

    if (!total) {
      return 0;
    }

    var area = _.reduce(selectedData, function (memo, d) {
      return (d.avg && d.freq) ? (d.avg * d.freq) + memo : memo;
    }, 0);

    return area / total;
  },

  _calcSum: function (data, start, end) {
    return _.reduce(data.slice(start, end), function (memo, d) {
      return d.freq + memo;
    }, 0);
  },

  _onChangeZoomed: function () {
    if (this.model.get('zoomed')) {
      this._onZoomIn();
    } else {
      this._resetWidget();
      this._dataviewModel.fetch();
    }
  },

  _showMiniRange: function () {
    var loBarIndex = this.model.get('lo_index');
    var hiBarIndex = this.model.get('hi_index');

    this.miniHistogramChartView.selectRange(loBarIndex, hiBarIndex);
    this.miniHistogramChartView.show();
  },

  _zoom: function () {
    this.model.set({ zoomed: true, zoom_enabled: false });
    this.histogramChartView.removeSelection();
  },

  _onZoomIn: function () {
    this.lockedByUser = false;
    this._showMiniRange();
    this.histogramChartView.setBounds();
    this._dataviewModel.enableFilter();
    this._dataviewModel.fetch();
  },

  _resetWidget: function () {
    this._numberOfFilters = 0;
    this.model.set({
      zoomed: false,
      zoom_enabled: false,
      filter_enabled: false,
      lo_index: null,
      hi_index: null,
      min: null,
      max: null,
      zlo_index: null,
      zhi_index: null,
      zmin: null,
      zmax: null
    });
    this.filter.unsetRange();
    this._dataviewModel.disableFilter();
    this.histogramChartView.unsetBounds();
    this.miniHistogramChartView.hide();
    this._clearTooltip();
    this._updateStats();
  },

  clean: function () {
    window.removeEventListener('resize', this._onWindowResized.bind(this));
    CoreView.prototype.clean.apply(this);
  }
});
