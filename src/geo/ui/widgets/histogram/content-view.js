var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var WidgetContent = require('../standard/widget_content_view');
var WidgetHistogramChart = require('./chart');
var placeholder = require('./placeholder.tpl');
var template = require('./content.tpl');
var xAxisTickFormatter = d3.format('.2s');

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
    this.viewModel = new Model();
    this.lockedByUser = false;
    WidgetContent.prototype.initialize.call(this);
  },

  _initViews: function() {
    this._setupDimensions();
    this._renderMainChart();
    this._renderMiniChart();
  },

  _initBinds: function() {
    this.dataModel.once('change:data', this._onFirstLoad, this);
    this.add_related_model(this.dataModel);
  },

  _onFirstLoad: function() {
    this.render();
    this.dataModel.bind('change:data', this._onChangeData, this);
    this._storeBounds();
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

      this.chart.replaceData(this.dataModel.getData());
    }

    if (this.unsettingRange) {
      this.unsettingRange = false;
      this.chart.replaceData(this.originalData);
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
    this.chart.resize(this.canvasWidth);
    this.miniChart.resize(this.canvasWidth);
  },

  _renderMainChart: function() {
    this.chart = new WidgetHistogramChart(({
      y: 0,
      margin: { top: 4, right: 4, bottom: 20, left: 4 },
      handles: true,
      width: this.canvasWidth,
      height: this.canvasHeight,
      data: this.dataModel.getData(),
      xAxisTickFormat: this._xAxisTickFormat.bind(this)
    }));
    this.$('.js-content').append(this.chart.el);
    this.addView(this.chart);

    this.chart.bind('range_updated', this._onRangeUpdated, this);
    this.chart.bind('on_brush_end', this._onBrushEnd, this);
    this.chart.bind('hover', this._onValueHover, this);
    this.chart.render().show();

    this._updateStats();
  },

  _xAxisTickFormat: function(d, i, data) {
    return (i === data.length - 1)
      ? this._formatNumber(data[i].end)
      : this._formatNumber(data[i].start);
  },

  _formatNumber: function(value, unit) {
    return xAxisTickFormatter(value) + (unit ? ' ' + unit : '');
  },

  _renderMiniChart: function() {
    this.miniChart = new WidgetHistogramChart(({
      className: 'mini',
      el: this.chart.$el, // TODO the mini-histogram should not depend on the chart histogram's DOM
      handles: false,
      width: this.canvasWidth,
      margin: { top: 0, right: 0, bottom: 0, left: 4 },
      y: 0,
      height: 20,
      data: this.dataModel.getData(),
      xAxisTickFormat: this._xAxisTickFormat.bind(this)
    }));

    this.miniChart.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniChart.render().hide();
  },

  _setupBindings: function() {
    this.viewModel.bind('change:zoomed', this._onChangeZoomed, this);
    this.viewModel.bind('change:zoom_enabled', this._onChangeZoomEnabled, this);
    this.viewModel.bind('change:filter_enabled', this._onChangeFilterEnabled, this);
    this.viewModel.bind('change:total', this._onChangeTotal, this);
    this.viewModel.bind('change:max',   this._onChangeMax, this);
    this.viewModel.bind('change:min',   this._onChangeMin, this);
    this.viewModel.bind('change:avg',   this._onChangeAvg, this);
  },

  _setupDimensions: function() {
    this.margin = { top: 0, right: 24, bottom: 0, left: 24 };

    this.canvasWidth  = this.$el.width() - this.margin.left - this.margin.right;
    this.canvasHeight = this.defaults.chartHeight - this.margin.top - this.margin.bottom;
  },

  _onValueHover: function(info) {
    var $tooltip = this.$(".js-tooltip");
    if (info && info.data) {
      $tooltip.css({ top: info.top, left: info.left });
      $tooltip.text(info.data);
      $tooltip.css({ left: info.left - $tooltip.width()/2 });
      $tooltip.fadeIn(70);
    } else {
      $tooltip.stop().hide();
    }
  },

  _onMiniRangeUpdated: function(loBarIndex, hiBarIndex) {
    this.lockedByUser = false;

    var data = this.originalData;

    this.lockZoomedData = false;

    var start = data[loBarIndex].start;
    var end = data[hiBarIndex - 1].end;

    this._setRange(start, end);
    this._updateStats();
  },

  _setRange: function(start, end) {
    this.filter.setRange({ min: start, max: end });
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

    var start = data[loBarIndex].start;
    var end = data[hiBarIndex - 1].end;

    this._setRange(start, end);
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

  _onChangeTotal: function() {
    //this._animateValue('.js-val', 'total', ' SELECTED');
    this.$('.js-val').text(this.chart.formatNumber(this.viewModel.get('total')) + ' SELECTED');
  },

  _onChangeMax: function() {
    //this._animateValue('.js-max', 'max', 'MAX');
    if (this.viewModel.get('max') === undefined) {
      return '0 MAX';
    }
    this.$('.js-max').text(this.chart.formatNumber(this.viewModel.get('max')) + ' MAX');
  },

  _onChangeMin: function() {
    //this._animateValue('.js-min', 'min', 'MIN');
    if (this.viewModel.get('min') === undefined) {
      return '0 MIN';
    }
    this.$('.js-min').text(this.chart.formatNumber(this.viewModel.get('min')) + ' MIN');
  },

  _onChangeAvg: function() {
    this.$('.js-avg').text(this.chart.formatNumber(this.viewModel.get('avg')) + ' AVG');
    //this._animateValue('.js-avg', 'avg', 'AVG');
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
    var data = this._getData();
    var min, max;

    if (data && data.length) {
      var loBarIndex = this.viewModel.get('lo_index') || 0;
      var hiBarIndex = this.viewModel.get('hi_index') || data.length;

      var sum = this._calcSum(data, loBarIndex, hiBarIndex);
      var avg = this._calcAvg(data);

      if (loBarIndex >= 0 && loBarIndex < data.length) {
        min = data[loBarIndex].min;
      }

      if (hiBarIndex >= 0 && hiBarIndex - 1 < data.length) {
        max = data[hiBarIndex - 1].max;
      }

      this.viewModel.set({ total: sum, min: min, max: max, avg: avg });
    }
  },

  _calcAvg: function(data) {
    return Math.round(d3.mean(data, function(d) { return _.isEmpty(d) ? 0 : d.freq; }));
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
    this.miniChart.show();
    this.chart.expand(this.canvasHeight + 60);

    this._showMiniRange();

    this.dataModel.set({ start: null, end: null, bins: null, own_filter: 1 });
    this.dataModel._fetch();
    this.lockedByUser = false;
  },

  _zoom: function() {
    this.lockedByUser = true;
    this.viewModel.set({ zoomed: true, zoom_enabled: false });
  },

  _onZoomOut: function() {
    this.lockedByUser = true;
    this.lockZoomedData = false;
    this.unsettingRange = true;

    this.dataModel.set({ own_filter: null });
    this.viewModel.set({ zoom_enabled: false, filter_enabled: false, lo_index: null, hi_index: null });
    this.filter.unsetRange();

    this.chart.contract(this.canvasHeight);
    this.chart.resetIndexes();

    this.miniChart.hide();

    this.chart.removeSelection();
  },

  _showMiniRange: function() {
    var data = this.dataModel.getData();

    var loBarIndex = this.viewModel.get('lo_index');
    var hiBarIndex = this.viewModel.get('hi_index');

    this.miniChart.selectRange(loBarIndex, hiBarIndex);
    this.miniChart.show();
  },

  _clear: function() {
    //if (!this.viewModel.get('zoomed')) {
      //this.viewModel.trigger('change:zoomed');
    //} else {
    this.viewModel.set({ zoomed: false, zoom_enabled: false });
    this.viewModel.trigger('change:zoomed');
    //}
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    View.prototype.clean.call(this);
  }
});
