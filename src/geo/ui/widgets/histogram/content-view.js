var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var formatter = require('cdb/core/format');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var HistogramTitleView = require('./histogram_title_view');
var WidgetContent = require('../standard/widget_content_view');
var WidgetViewModel = require('../widget_content_model');
var HistogramChartView = require('./chart');
var placeholder = require('./placeholder.tpl');
var template = require('./content.tpl');

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
    this.dataModel = this.options.dataModel;
    this.firstData = _.clone(this.options.dataModel);
    this.viewModel = new WidgetViewModel();
    this.lockedByUser = false;
    WidgetContent.prototype.initialize.call(this);
  },

  _initViews: function() {
    var titleView = new HistogramTitleView({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
    this.$('.js-title').html(titleView.render().el);
    this.addView(titleView);

    this._setupDimensions();
    this._renderMiniChart();
    this._renderMainChart();
  },

  _initBinds: function() {
    this.dataModel.once('change:data', this._onFirstLoad, this);
    this.viewModel.bind('change:collapsed', function(mdl, isCollapsed) {
      this.$el.toggleClass('is-collapsed', !!isCollapsed);
    }, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onFirstLoad: function() {
    this.render();
    this._storeBounds();
    this.dataModel.bind('change:data', this._onChangeData, this);
    this.dataModel._fetch();
  },

  _storeBounds: function() {
    var data = this.dataModel.getData();
    if (data && data.length > 0) {
      var start = data[0].start;
      var end = data[data.length - 1].end;
      this.dataModel.set({ start: start, end: end, bins: data.length });
    }
  },

  _isZoomed: function() {
    return this.viewModel.get('zoomed');
  },

  _onChangeData: function() {
    // if the action was initiated by the user
    // don't replace the stored data
    if (this.lockedByUser) {
      this.lockedByUser = false;
    } else {
      if (this._isZoomed()) {
        this.zoomedData = this.dataModel.getData();
      } else {
        this.originalData = this.dataModel.getData();
      }

      this.histogramChartView.replaceData(this.dataModel.getData());
    }

    if (this.unsettingRange) {
      this.unsettingRange = false;
      this.histogramChartView.replaceData(this.originalData);
      this.viewModel.set({ lo_index: null, hi_index: null });
    } else {
      if (this._isZoomed() && !this.lockZoomedData) {
        this.lockZoomedData = true;
        this.zoomedData = this.dataModel.getData();
      }
    }

    this._updateStats();
  },

  render: function() {

    this.clearSubViews();

    _.bindAll(this, '_onWindowResize');

    $(window).bind('resize', this._onWindowResize);

    var data = this.dataModel.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
      this.originalData = this.dataModel.getData();
      this._setupBindings();
      this._initViews();
    }

    return this;
  },

  _addPlaceholder: function() {
    this.$('.js-content').append(placeholder());
  },

  _onWindowResize: function() {
    this._setupDimensions();
    if (this.histogramChartView) this.histogramChartView.resize(this.canvasWidth);
    if (this.miniHistogramChartView) this.miniHistogramChartView.resize(this.canvasWidth);
  },

  _renderMainChart: function() {
    this.histogramChartView = new HistogramChartView(({
      margin: { top: 4, right: 4, bottom: 20, left: 4 },
      handles: true,
      width: this.canvasWidth,
      height: this.canvasHeight,
      data: this.dataModel.getData()
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
      className: 'mini',
      handles: false,
      width: this.canvasWidth,
      margin: { top: 0, right: 0, bottom: 20, left: 4 },
      height: 40,
      data: this.dataModel.getData()
    }));

    this.addView(this.miniHistogramChartView);
    this.$('.js-content').append(this.miniHistogramChartView.el);
    this.miniHistogramChartView.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniHistogramChartView.render().hide();
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

  _setupDimensions: function() {
    this.margin = { top: 0, right: 24, bottom: 0, left: 24 };

    this.canvasWidth  = this.$el.width() - this.margin.left - this.margin.right;
    this.canvasHeight = this.defaults.chartHeight - this.margin.top - this.margin.bottom;
  },

  _clearTooltip: function() {
    this.$(".js-tooltip").stop().hide();
  },

  _onValueHover: function(info) {
    var $tooltip = this.$(".js-tooltip");

    if (info && info.data) {
      $tooltip.css({ top: info.top, left: info.left });
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
    this.filter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
    this._updateStats();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this._getData();

    if (this._isZoomed()) {
      this.lockedByUser = true;
    }

    var properties = { filter_enabled: true, lo_index: loBarIndex, hi_index: hiBarIndex };
    if (!this.viewModel.get('zoomed')) {
      properties.zoom_enabled = true;
    }
    this.viewModel.set(properties);

    this.filter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
    this._updateStats();
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
    var data = this.dataModel.getData();

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

  _onChangeNulls: function() {
    this.$('.js-nulls').text(formatter.formatNumber(this.viewModel.get('nulls')) + ' NULLS');
    this.$('.js-nulls').attr('title', this._formatNumberWithCommas(this.viewModel.get('nulls').toFixed(2)) + ' NULLS');
  },

  _onChangeTotal: function() {
    this.$('.js-val').text(formatter.formatNumber(this.viewModel.get('total')) + ' SELECTED');
    this.$('.js-val').attr('title', this._formatNumberWithCommas(this.viewModel.get('total').toFixed(2)) + ' SELECTED');
  },

  _onChangeMax: function() {
    if (this.viewModel.get('max') === undefined) {
      this.$('.js-min').text('0 MAX');
      return;
    }
    this.$('.js-max').text(formatter.formatNumber(this.viewModel.get('max')) + ' MAX');
    this.$('.js-max').attr('title', this._formatNumberWithCommas(this.viewModel.get('max').toFixed(2)) + ' MAX');
  },

  _onChangeMin: function() {
    if (this.viewModel.get('min') === undefined) {
      this.$('.js-min').text('0 MIN');
      return;
    }
    this.$('.js-min').text(formatter.formatNumber(this.viewModel.get('min')) + ' MIN');
    this.$('.js-min').attr('title', this._formatNumberWithCommas(this.viewModel.get('min').toFixed(2)) + ' MIN');
  },

  _onChangeAvg: function() {
    this.$('.js-avg').text(formatter.formatNumber(this.viewModel.get('avg')) + ' AVG');
    this.$('.js-avg').attr('title', this._formatNumberWithCommas(this.viewModel.get('avg').toFixed(2)) + ' AVG');
  },

  _formatNumberWithCommas: function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  _animateValue: function(className, what, unit) {
    var self = this;
    var format = d3.format('.2s');

    var from = this.viewModel.previous(what) || 0;
    var to = this.viewModel.get(what);

    $(className).prop('counter', from).stop().animate({ counter: to }, {
      duration: 500,
      easing: 'swing',
      step: function (i) {
        if (i === isNaN) {
          i = 0;
        }
        $(this).text(format(i) + ' ' + unit);
      }
    });
  },

  _updateStats: function() {
    var data = this.originalData;

    if (this._isZoomed()) {
      data = this.zoomedData;
    }

    var nulls = this.dataModel.get('nulls');

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
    this.miniHistogramChartView.show();
    this.histogramChartView.expand(20);

    this._showMiniRange();

    this.dataModel.set({ start: null, end: null, bins: null, own_filter: 1 });
    this.dataModel._fetch();
    this.lockedByUser = false;
  },

  _zoom: function() {
    this.lockedByUser = true;
    this.viewModel.set({ zoomed: true, zoom_enabled: false });
    this.histogramChartView.removeSelection();
  },

  _onZoomOut: function() {
    this.lockedByUser = true;
    this.lockZoomedData = false;
    this.unsettingRange = true;

    this.dataModel.set({ own_filter: null });
    this.viewModel.set({ zoom_enabled: false, filter_enabled: false, lo_index: null, hi_index: null });

    this.filter.unsetRange();

    this.histogramChartView.contract(this.canvasHeight);
    this.histogramChartView.resetIndexes();

    this.miniHistogramChartView.hide();
  },

  _showMiniRange: function() {
    var data = this.dataModel.getData();

    var loBarIndex = this.viewModel.get('lo_index');
    var hiBarIndex = this.viewModel.get('hi_index');

    this.miniHistogramChartView.selectRange(loBarIndex, hiBarIndex);
    this.miniHistogramChartView.show();
  },

  _clear: function() {
    this.histogramChartView.removeSelection();
    this.viewModel.set({ zoomed: false, zoom_enabled: false });
    this.viewModel.trigger('change:zoomed');
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    View.prototype.clean.call(this);
  }
});
