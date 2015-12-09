var _ = cdb._;
var formatter = cdb.core.format;
var HistogramTitleView = require('./histogram_title_view');
var WidgetContent = require('../standard/widget_content_view');
var WidgetViewModel = require('../widget_content_model');
var HistogramChartView = require('./chart');
var placeholder = require('./placeholder.tpl');
var template = require('./content.tpl');
var AnimateValues = require('../animate_values.js');
var animationTemplate = require('./animation_template.tpl');

/**
 * Widget content view for a histogram
 */
module.exports = WidgetContent.extend({

  defaults: {
    chartHeight: 48 + 20 + 4
  },

  events: {
    'click .js-clear': '_clear',
    'click .js-zoom': '_zoom'
  },

  initialize: function() {
    this.model = this.options.dataModel;
    this.viewModel = new WidgetViewModel();
    this.lockedByUser = false;
    WidgetContent.prototype.initialize.call(this);
  },

  _initViews: function() {
    var titleView = new HistogramTitleView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
    this.$('.js-title').html(titleView.render().el);
    this.addView(titleView);

    this._renderMiniChart();
    this._renderMainChart();
  },

  _initBinds: function() {
    this.model.once('change:data', this._onFirstLoad, this);
    this.model.bind('change:collapsed', function(mdl, isCollapsed) {
      this.$el.toggleClass('is-collapsed', !!isCollapsed);
    }, this);
  },

  _onFirstLoad: function() {
    this.render();
    this._storeBounds();

    this.model.bind('change', this._onChangeModel, this);
    this.model._fetch();
  },

  _storeBounds: function() {
    var data = this.model.getData();
    if (data && data.length > 0) {
      this.start = data[0].start;
      this.end = data[data.length - 1].end;
      this.binsCount = data.length;
      this.model.set({ start: this.start, end: this.end, bins: this.binsCount });
    }
  },

  _isZoomed: function() {
    return this.viewModel.get('zoomed');
  },

  _onChangeModel: function() {

    // When the histogram is zoomed, we don't need to rely
    // on the change url to update the histogram
    if (this.model.changed.url && this._isZoomed()) {
      return;
    }

    // if the action was initiated by the user
    // don't replace the stored data
    if (this.lockedByUser) {
      this.lockedByUser = false;
    } else {
      if (this._isZoomed()) {
        this.zoomedData = this.model.getData();
      } else {
        this.histogramChartView.showShadowBars();
        this.originalData = this.model.getData();
      }
        this.histogramChartView.replaceData(this.model.getData());
    }

    if (this.unsettingRange) {
      this._unsetRange();
    } else {
      if (this._isZoomed() && !this.lockZoomedData) {
        this.lockZoomedData = true;
        this.zoomedData = this.model.getData();
      }
    }

    this._updateStats();
  },

  render: function() {
    this.clearSubViews();

    var data = this.model.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    this.$el.html(
      template({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
      this.originalData = this.model.getData();
      this._setupBindings();
      this._initViews();
    }

    return this;
  },

  _unsetRange: function() {
    this.unsettingRange = false;
    this.histogramChartView.replaceData(this.originalData);
    this.viewModel.set({ lo_index: null, hi_index: null });

    if (!this._isZoomed()) {
      this.histogramChartView.showShadowBars();
    }
  },

  _addPlaceholder: function() {
    this.$('.js-content').append(placeholder());
  },

  _renderMainChart: function() {
    this.histogramChartView = new HistogramChartView(({
      margin: { top: 4, right: 4, bottom: 4, left: 4 },
      hasShadowBards: true,
      hasHandles: true,
      hasAxisTip: true,
      width: this.canvasWidth,
      height: this.defaults.chartHeight,
      data: this.model.getData(),
      shadowData: this.model.getData()
    }));

    this.$('.js-content').append(this.histogramChartView.el);
    this.addView(this.histogramChartView);

    this.histogramChartView.bind('range_updated', this._onRangeUpdated, this);
    this.histogramChartView.bind('on_brush_end', this._onBrushEnd, this);
    this.histogramChartView.bind('hover', this._onValueHover, this);
    this.histogramChartView.render().show();

    this._updateStats();
  },

  _renderMiniChart: function() {
    this.miniHistogramChartView = new HistogramChartView(({
      className: 'CDB-Chart--mini',
      margin: { top: 0, right: 0, bottom: 4, left: 4 },
      height: 40,
      showOnWidthChange: false,
      data: this.model.getData()
    }));

    this.addView(this.miniHistogramChartView);
    this.$('.js-content').append(this.miniHistogramChartView.el);
    this.miniHistogramChartView.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniHistogramChartView.render();
  },

  _setupBindings: function() {
    this.viewModel.bind('change:zoomed', this._onChangeZoomed, this);
    this.viewModel.bind('change:zoom_enabled', this._onChangeZoomEnabled, this);
    this.viewModel.bind('change:filter_enabled', this._onChangeFilterEnabled, this);
    this.viewModel.bind('change:total', this._onChangeTotal, this);
    this.viewModel.bind('change:nulls', this._onChangeNulls, this);
    this.viewModel.bind('change:max',   this._onChangeMax, this);
    this.viewModel.bind('change:min',   this._onChangeMin, this);
    this.viewModel.bind('change:avg',   this._onChangeAvg, this);
  },

  _clearTooltip: function() {
    this.$(".js-tooltip").stop().hide();
  },

  _onValueHover: function(info) {
    var $tooltip = this.$(".js-tooltip");

    if (info && info.data) {
      var bottom = this.defaults.chartHeight + 3 - info.top;

      $tooltip.css({ bottom: bottom, left: info.left });
      $tooltip.text(info.data);
      $tooltip.css({ left: info.left - $tooltip.width()/2 });
      $tooltip.fadeIn(70);
    } else {
      this._clearTooltip();
    }
  },

  _onMiniRangeUpdated: function(loBarIndex, hiBarIndex) {
    this.lockedByUser = false;
    this.lockZoomedData = false;

    this._clearTooltip();
    this.histogramChartView.removeSelection();

    var data = this.originalData;

    if (loBarIndex >= 0 && loBarIndex < data.length && (hiBarIndex - 1) >= 0 && (hiBarIndex - 1) < data.length) {
      this.filter.setRange(
        data[loBarIndex].start,
        data[hiBarIndex - 1].end
      );
      this._updateStats();
    } else {
      console.error('Error accessing array bounds', loBarIndex, hiBarIndex, data);
    }
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this._getData();
    
    if (!data || !data.length) {
      return;
    }

    if (this._isZoomed()) {
      this.lockedByUser = true;
    }

    var properties = { filter_enabled: true, lo_index: loBarIndex, hi_index: hiBarIndex };

    if (!this.viewModel.get('zoomed')) {
      properties.zoom_enabled = true;
    }

    this.viewModel.set(properties);

    if (loBarIndex >= 0 && loBarIndex < data.length && (hiBarIndex - 1) >= 0 && (hiBarIndex - 1) < data.length) {
      this.filter.setRange(
        data[loBarIndex].start,
        data[hiBarIndex - 1].end
      );
      this._updateStats();
    } else {
      console.error('Error accessing array bounds', loBarIndex, hiBarIndex, data);
    }
  },

  _onRangeUpdated: function(loBarIndex, hiBarIndex) {

    var self = this;
    if (this.viewModel.get('zoomed')) {
      this.viewModel.set({ zoom_enabled: false, lo_index: loBarIndex, hi_index: hiBarIndex });
    } else {
      this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    }

    var updateStats = _.debounce(function() { self._updateStats(); }, 400);
    updateStats();
  },

  _getData: function() {
    var data = this.model.getData();

    if (this._isZoomed()) {
      data = this.zoomedData;
    }
    return data;
  },

  _onChangeFilterEnabled: function() {
    this.$(".js-filter").toggleClass('is-hidden', !this.viewModel.get('filter_enabled'));
  },

  _onChangeZoomEnabled: function() {
    this.$(".js-zoom").toggleClass('is-hidden', !this.viewModel.get('zoom_enabled'));
  },

  _changeHeaderValue: function(className, what, suffix) {
    if (this.viewModel.get(what) === undefined) {
      this.$(className).text('0 ' + suffix);
      return;
    }

    this._addTitleForValue(className, what, suffix);

    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateValue(this.viewModel, what, className, animationTemplate, {
      formatter: formatter.formatNumber,
      templateData: { suffix: " " + suffix }
    });
  },

  _onChangeNulls: function() {
    this._changeHeaderValue('.js-nulls', 'nulls', 'NULL ROWS');
  },

  _onChangeTotal: function() {
    this._changeHeaderValue('.js-val', 'total', 'SELECTED');
  },

  _onChangeMax: function() {
    this._changeHeaderValue('.js-max', 'max', 'MAX');
  },

  _onChangeMin: function() {
    this._changeHeaderValue('.js-min', 'min', 'MIN');
  },

  _onChangeAvg: function() {
    this._changeHeaderValue('.js-avg', 'avg', 'AVG');
  },

  _addTitleForValue: function(className, what, unit) {
    this.$(className).attr('title', this._formatNumberWithCommas(this.viewModel.get(what).toFixed(2)) + ' ' + unit);
  },

  _formatNumberWithCommas: function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  _updateStats: function() {
    var data = this.originalData;

    if (this._isZoomed()) {
      data = this.zoomedData;
    }

    var nulls = this.model.get('nulls');

    var min, max;

    if (data && data.length) {

      var loBarIndex = this.viewModel.get('lo_index') || 0;
      var hiBarIndex = this.viewModel.get('hi_index') || data.length;

      var sum = this._calcSum(data, loBarIndex, hiBarIndex);
      var avg = this._calcAvg(data, loBarIndex, hiBarIndex);

      if (loBarIndex >= 0 && loBarIndex < data.length) {
        min = data[loBarIndex].start;
      }

      if (hiBarIndex >= 0 && hiBarIndex - 1 < data.length) {
        max = data[hiBarIndex - 1].end;
      }

      this.viewModel.set({ total: sum, nulls: nulls, min: min, max: max, avg: avg });
    }
  },

  _calcAvg: function(data, start, end) {

    var selectedData = data.slice(start, end);

    var total = this._calcSum(data, start, end, total);

    if (!total) {
      return 0;
    }

    var area = _.reduce(selectedData, function(memo, d) {
      return (d.avg && d.freq) ? (d.avg * d.freq) + memo : memo;
    }, 0);

    return area / total;
  },

  _calcSum: function(data, start, end) {
    return _.reduce(data.slice(start, end), function(memo, d) {
      return d.freq + memo;
    }, 0);
  },

  _onChangeZoomed: function() {
    if (this.viewModel.get('zoomed')) {
      this._onZoomIn();
    } else {
      this._onZoomOut();
    }
  },

  _onZoomIn: function() {
    this._showMiniRange();
    this.histogramChartView.expand(20);

    this.histogramChartView.removeShadowBars();

    this.model.set({ start: null, end: null, bins: null, own_filter: 1 });
    this.model._fetch();
    this.lockedByUser = false;
  },

  _zoom: function() {
    this.lockedByUser = true;
    this.viewModel.set({ zoomed: true, zoom_enabled: false });
    this.histogramChartView.removeSelection();
  },

  _onZoomOut: function() {
    this.lockedByUser   = true;
    this.lockZoomedData = false;
    this.unsettingRange = true;

    this.model.set({ start: this.start, end: this.end, bins: this.binsCount, own_filter: null });

    this.viewModel.set({ zoom_enabled: false, filter_enabled: false, lo_index: null, hi_index: null });

    this.filter.unsetRange();

    this.histogramChartView.contract(this.defaults.chartHeight);
    this.histogramChartView.resetIndexes();

    this.miniHistogramChartView.hide();
  },

  _showMiniRange: function() {
    var data = this.model.getData();

    var loBarIndex = this.viewModel.get('lo_index');
    var hiBarIndex = this.viewModel.get('hi_index');

    this.miniHistogramChartView.selectRange(loBarIndex, hiBarIndex);
    this.miniHistogramChartView.show();
  },

  _clear: function() {
    this.histogramChartView.removeSelection();
    this.viewModel.set({ zoomed: false, zoom_enabled: false });
    this.viewModel.trigger('change:zoomed');
  }
});
