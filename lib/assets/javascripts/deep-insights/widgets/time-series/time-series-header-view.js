var cdb = require('internal-carto.js');
var CoreView = require('backbone/core-view');
var d3 = require('d3');
var template = require('./time-series-header.tpl');
var formatter = require('../../formatter');
var AnimateValues = require('../animate-values.js');
var animationTemplate = require('./animation-template.tpl');
var TipsyTooltipView = require('../../../builder/components/tipsy-tooltip-view');

/**
 * View to reset render range.
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-contentSpaced CDB-Widget-contentFull',

  events: {
    'click .js-clear': '_onClick'
  },

  options: {
    showClearButton: true
  },

  initialize: function (opts) {
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');
    if (!opts.layerModel) throw new Error('layerModel is required');
    if (!opts.rangeFilter) throw new Error('rangeFilter is required');
    if (!opts.timeSeriesModel) throw new Error('timeSeriesModel is required');
    if (opts.selectedAmount === void 0) throw new Error('selectedAmount is required');

    this._timeSeriesModel = opts.timeSeriesModel;
    this._dataviewModel = opts.dataviewModel;
    this._rangeFilter = opts.rangeFilter;
    this._selectedAmount = opts.selectedAmount;
    this._layerModel = opts.layerModel;

    this.model = new cdb.core.Model();

    this._createFormatter();
    this._initBinds();
  },

  render: function () {
    var title = this._timeSeriesModel.get('title');
    var showSelection = !this._rangeFilter.isEmpty();

    this.$el.html(
      template({
        start: this.model.get('left_axis_tip') || this.formatter(this._rangeFilter.get('min')),
        end: this.model.get('right_axis_tip') || this.formatter(this._rangeFilter.get('max')),
        title: title,
        showClearButton: this.options.showClearButton && showSelection,
        showSelection: showSelection
      })
    );

    this._animateValue();
    this._initViews();

    return this;
  },

  _initViews: function () {
    var actionsTooltip = new TipsyTooltipView({
      el: this.$el.find('.js-actions'),
      gravity: 'auto'
    });
    this.addView(actionsTooltip);
  },

  _createFormatter: function () {
    this.formatter = formatter.formatNumber;

    if (this._dataviewModel.getColumnType() === 'date') {
      this.formatter = formatter.timestampFactory(this._dataviewModel.get('aggregation'), this._dataviewModel.getCurrentOffset());
    }
  },

  _onLocalTimezoneChanged: function () {
    this._createFormatter();
    this.render();
  },

  _animateValue: function () {
    var animator = new AnimateValues({
      el: this.$el
    });
    var property = this._rangeFilter.isEmpty() ? 'totalAmount' : 'filteredAmount';
    var to = this._dataviewModel.get(property);

    animator.animateFromValues.call(this, this._selectedAmount, to, '.js-val', animationTemplate, {
      formatter: formatter.formatNumber,
      templateData: { suffix: ' Selected' }
    });

    this._selectedAmount = to;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:left_axis_tip change:right_axis_tip', this.render);
    this.listenTo(this._timeSeriesModel, 'change:title', this.render);
    this.listenTo(this._timeSeriesModel, 'change:local_timezone', this._onLocalTimezoneChanged);
    this.listenTo(this._dataviewModel, 'change:totalAmount', this._animateValue);
    this.listenTo(this._dataviewModel, 'on_update_axis_tip', this._onUpdateAxisTip);
    this.listenTo(this._rangeFilter, 'change', this.render);
  },

  _onUpdateAxisTip: function (axisTip) {
    this.model.set(axisTip.attr, axisTip.text);
  },

  _setupScales: function () {
    var data = this._dataviewModel.get('data');
    var columnType = this._dataviewModel.getColumnType();

    if (columnType === 'date') {
      this._scale = d3.time.scale()
        .domain([data[0].start * 1000, data[data.length - 1].end * 1000])
        .range([this._dataviewModel.get('start'), this._dataviewModel.get('end')]);
    } else {
      this._scale = d3.scale.linear()
        .domain([data[0].start, data[data.length - 1].end])
        .range([this._dataviewModel.get('start'), this._dataviewModel.get('end')]);
    }
  },

  _onClick: function () {
    this.trigger('resetFilter', this);
  }
});
