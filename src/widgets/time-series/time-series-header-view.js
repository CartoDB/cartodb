var _ = require('underscore');
var cdb = require('cartodb.js');
var d3 = require('d3');
var template = require('./time-series-header.tpl');
var formatter = require('../../formatter');
var AnimateValues = require('../animate-values.js');
var animationTemplate = require('./animation-template.tpl');

var FORMATTER_TYPES = {
  'number': d3.format(',.0f'),
  'time': d3.time.format('%H:%M'),
  'date': d3.time.format('%x')
};

/**
 * View to reset render range.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-header--timeSeries CDB-Widget-contentSpaced',

  events: {
    'click .js-clear': '_onClick'
  },

  options: {
    showClearButton: true
  },

  initialize: function (opts) {
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');
    if (!opts.rangeFilter) throw new Error('rangeFilter is required');
    if (!opts.selectionTotal) throw new Error('selectionTotal is required');

    this._dataviewModel = opts.dataviewModel;
    this._rangeFilter = opts.rangeFilter;
    this._selectionTotal = opts.selectionTotal;
    this._layer = this._dataviewModel.layer;
    this._setupScales();
    this._initBinds();
  },

  render: function () {
    var columnType = this._getColumnType();
    var scale = this._scale;
    var filter = this._rangeFilter;
    var showSelection = !filter.isEmpty();
    var start;
    var end;

    if (showSelection) {
      if (columnType === 'date') {
        var startDate = new Date(scale.invert(filter.get('min')));
        var endDate = new Date(scale.invert(filter.get('max')));

        start = FORMATTER_TYPES['time'](startDate) + ' ' + FORMATTER_TYPES['date'](startDate);
        end = FORMATTER_TYPES['time'](endDate) + ' ' + FORMATTER_TYPES['date'](endDate);
      } else {
        start = FORMATTER_TYPES['number'](scale(filter.get('min')));
        end = FORMATTER_TYPES['number'](scale(filter.get('max')));
      }
    }

    this.$el.html(
      template({
        start: start,
        end: end,
        showClearButton: this.options.showClearButton && showSelection,
        showSelection: showSelection
      })
    );

    this._selectionTotal.set('total', this._calculateTotal());

    return this;
  },

  _onTotalChange: function () {
    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateValue.call(this, this._selectionTotal, 'total', '.js-val', animationTemplate, {
      formatter: formatter.formatNumber,
      templateData: { suffix: ' Selected' }
    });
  },

  _calculateTotal: function () {
    var data = this._dataviewModel.get('data');
    var start = this._rangeFilter.get('min');
    var end = this._rangeFilter.get('max');
    var binStart = 0;
    var binEnd = data.length - 1;

    if (start && end) {
      var bins = this._findBinsIndexes(data, start, end);
      binStart = bins.start;
      binEnd = bins.end;
    }

    return this._calcSum(data, binStart, binEnd);
  },

  _findBinsIndexes: function (data, start, end) {
    var startBin = _.find(data, { start: start });
    var endBin = _.find(data, { end: end });

    return {
      start: Math.min(startBin.bin, endBin.bin),
      end: Math.max(startBin.bin, endBin.bin)
    };
  },

  _calcSum: function (data, start, end) {
    return _.reduce(data.slice(start, end + 1), function (memo, d) {
      return d.freq + memo;
    }, 0);
  },

  _initBinds: function () {
    this.listenTo(this._selectionTotal, 'change:total', this._onTotalChange);
    this._rangeFilter.bind('change', this.render, this);
    this.add_related_model(this._rangeFilter);
  },

  _getColumnType: function () {
    return this._layer.get('column_type') || this._dataviewModel.get('column_type');
  },

  _setupScales: function () {
    var data = this._dataviewModel.get('data');
    var columnType = this._getColumnType();

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
    this._selectionTotal.set('total', 0);
    this.trigger('resetFilter', this);
  }
});
