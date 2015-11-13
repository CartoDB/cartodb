var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var WidgetContent = require('../standard/widget_content_view');
var WidgetHistogramChart = require('./chart');
var d3 = require('d3');
var placeholder = require('./placeholder.tpl');
var template = require('./content.tpl');

/**
 * Default widget content view:
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
    this.viewModel = new Model();
    WidgetContent.prototype.initialize.call(this);
  },

  _initViews: function() {
    this._setupDimensions();
    this._renderMainChart();
    this._renderMiniChart();
  },

  _initBinds: function() {
    this.dataModel.bind('change:off', this._onFirstLoad, this);
    this.add_related_model(this.dataModel);
  },

  _onFirstLoad: function() {
    this.render();
    this.dataModel.unbind('change:off', this._onFirstLoad, this);
    this.dataModel.bind('change:on', this._onChangeWithOwnFiltersData, this);
    this._storeBounds();
  },

  _storeBounds: function() {
    var data = this.dataModel.getDataWithoutOwnFilterApplied();
    var start = data[0].start;
    var end = data[data.length - 1].end;
    this.dataModel.set({ start: start, end: end, bins: data.length });
  },

  _onChangeWithOwnFiltersData: function() {

    console.log('Locked by user: ' + this.lockedByUser);

    // if the action was initiated by the user
    // don't replace the stored data
    if (this.lockedByUser) {
      this.lockedByUser = false;
    } else {
      this.originalData = this.dataModel.getDataWithoutOwnFilterApplied();
      console.log('Storing new data: ' + this.originalData);
    }

    if (this.unsettingRange) {
      this.chart.replaceData(this.originalData);
      this.unsettingRange = false;
      console.log("Replacing data");
    } else {
      var data = this.dataModel.getDataWithOwnFilterApplied();
      this.chart.replaceData(data);
    }
  },

  render: function() {

    this.clearSubViews();

    _.bindAll(this, '_onWindowResize');

    $(window).bind('resize', this._onWindowResize);

    var data = this.dataModel.getData().off;
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;

    window.viewModel = this.viewModel; // TODO: remove
    window.dataModel = this.dataModel; // TODO: remove
    window.filter    = this.filter;    // TODO: remove

    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    } else {
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
      data: this.dataModel.getDataWithOwnFilterApplied()
    }));
    this.$('.js-content').append(this.chart.el);
    this.addView(this.chart);

    this.chart.bind('range_updated', this._onRangeUpdated, this);
    this.chart.bind('on_brush_end', this._onBrushEnd, this);
    this.chart.bind('hover', this._onValueHover, this);
    this.chart.render().show();

    window.chart = this.chart; // TODO: remove

    this._updateStats();
  },

  _renderMiniChart: function() {
    this.originalData = this.dataModel.getDataWithoutOwnFilterApplied();
    window.originalData = this.originalData;

    this.miniChart = new WidgetHistogramChart(({
      className: 'mini',
      el: this.chart.$el, // TODO the mini-histogram should not depend on the chart histogram's DOM
      handles: false,
      width: this.canvasWidth,
      margin: { top: 0, right: 0, bottom: 0, left: 4 },
      y: 0,
      height: 20,
      data: this.dataModel.getDataWithoutOwnFilterApplied()
    }));

    this.miniChart.bind('on_brush_end', this._onMiniRangeUpdated, this);
    this.miniChart.render().hide();
    window.miniChart = this.miniChart; // TODO: remove
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
    if (info.freq > 0) {
      $tooltip.css({ top: info.top, left: info.left });
      $tooltip.text(info.freq);
      $tooltip.fadeIn(70);
    } else {
      $tooltip.stop().hide();
    }
  },

  _onMiniRangeUpdated: function(loBarIndex, hiBarIndex) {
    this.lockedByUser = true;
    this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });

    var data = this.originalData;

    var start = data[loBarIndex].start;
    var end = data[hiBarIndex - 1].end;

    this.dataModel.set({ start: start, end: end });

    this._setRange(data, start, end);

    this._updateStats();
  },

  _setRange: function(data, start, end) {
    this.filter.setRange({ min: start, max: end });
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this.dataModel.getDataWithoutOwnFilterApplied();

    this.lockedByUser = true;

    var start = data[loBarIndex].start;
    var end = data[hiBarIndex - 1].end;

    //this.dataModel.set({ start: start, end: end });

    var properties = { filter_enabled: true, lo_index: loBarIndex, hi_index: hiBarIndex };

    if (!this.viewModel.get('zoomed')) {
      properties.zoom_enabled = true;
    }

    this.viewModel.set(properties);

    this.chart.lock();

    this._setRange(data, start, end);
  },

  _onRangeUpdated: function(loBarIndex, hiBarIndex) {
    if (this.viewModel.get('zoomed')) {
      this.viewModel.set({ zoom_enabled: false, lo_index: loBarIndex, hi_index: hiBarIndex });
    } else {
      this.viewModel.set({ lo_index: loBarIndex, hi_index: hiBarIndex });
    }

    this._updateStats();
  },

  _onChangeFilterEnabled: function() {
    this.$(".js-filter").toggleClass('is-hidden', !this.viewModel.get('filter_enabled'));
  },

  _onChangeZoomEnabled: function() {
    this.$(".js-zoom").toggleClass('is-hidden', !this.viewModel.get('zoom_enabled'));
  },

  _onChangeTotal: function() {
    this._animateValue('.js-val', 'total', ' SELECTED');
  },

  _onChangeMax: function() {
    this._animateValue('.js-max', 'max', 'MAX');
  },

  _onChangeMin: function() {
    this._animateValue('.js-min', 'min', 'MIN');
  },

  _onChangeAvg: function() {
    this._animateValue('.js-avg', 'avg', 'AVG');
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
        var v = Math.floor(i);
        $(this).text(format(v) + ' ' + unit);
      }
    });
  },

  _getData: function(full) {
    var data = this.dataModel.getDataWithoutOwnFilterApplied();

    if (full || (!this.viewModel.get('lo_index') && !this.viewModel.get('hi_index'))) {
      return data;
    }

    return data.slice(this.viewModel.get('lo_index'), this.viewModel.get('hi_index'));
  },

  _updateStats: function() {
    var data = this.dataModel.getDataWithoutOwnFilterApplied();

    var loBarIndex = this.viewModel.get('lo_index') || 0;
    var hiBarIndex = this.viewModel.get('hi_index') ?  this.viewModel.get('hi_index') - 1 : data.length - 1;

    if (hiBarIndex + 1 > data.length) {
      return;
    }

    var sum = _.reduce(data.slice(loBarIndex, hiBarIndex + 1), function(memo, d) {
      return _.isEmpty(d) ? memo : d.freq + memo;
    }, 0);

    var avg = Math.round(d3.mean(data, function(d) { return _.isEmpty(d) ? 0 : d.freq; }));
    var min = data && data.length && data[loBarIndex].min;
    var max = data && data.length && data[hiBarIndex].max;

    this.viewModel.set({ total: sum, min: min, max: max, avg: avg });
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

    var data = this.dataModel.getDataWithOwnFilterApplied();
    this.chart.replaceData(data);
  },

  _zoom: function() {
    this.lockedByUser = true;
    this.viewModel.set({ zoomed: true, zoom_enabled: false });
  },

  _onZoomOut: function() {
    this.viewModel.set({ zoom_enabled: false, filter_enabled: false, lo_index: null, hi_index: null });

    this.chart.contract(this.canvasHeight);
    this.chart.resetIndexes();

    this.unsettingRange = true;
    this.filter.unsetRange();

    this.miniChart.hide();

    this.chart.removeSelection();
  },

  _showMiniRange: function() {
    var data = this.dataModel.getDataWithoutOwnFilterApplied();

    var loBarIndex = this.viewModel.get('lo_index');
    var hiBarIndex = this.viewModel.get('hi_index');

    this.miniChart.selectRange(loBarIndex, hiBarIndex);
    this.miniChart.show();
  },

  _clear: function() {
    this.lockedByUser = true;

    if (!this.viewModel.get('zoomed')) {
      this.viewModel.trigger('change:zoomed');
    } else {
      this.viewModel.set({ zoomed: false, zoom_enabled: true });
    }
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    View.prototype.clean.call(this);
  }
});
