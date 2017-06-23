var cdb = require('cartodb.js');
var template = require('./time-series-header.tpl');
var formatter = require('../../formatter');
var AnimateValues = require('../animate-values.js');
var animationTemplate = require('./animation-template.tpl');

/**
 * View to reset render range.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-contentSpaced',

  events: {
    'click .js-clear': '_onClick'
  },

  options: {
    showClearButton: true
  },

  initialize: function (opts) {
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');
    if (!opts.rangeFilter) throw new Error('rangeFilter is required');
    if (!opts.timeSeriesModel) throw new Error('timeSeriesModel is required');
    if (opts.selectedAmount === void 0) throw new Error('selectedAmount is required');

    this._timeSeriesModel = opts.timeSeriesModel;
    this._dataviewModel = opts.dataviewModel;
    this._rangeFilter = opts.rangeFilter;
    this._selectedAmount = opts.selectedAmount;
    this._layer = this._dataviewModel.layer;
    this._initBinds();
  },

  render: function () {
    var title = this._timeSeriesModel.get('title');
    var filter = this._rangeFilter;
    var showSelection = !filter.isEmpty();
    var start;
    var end;

    this.$el.html(
      template({
        start: start,
        end: end,
        title: title,
        showClearButton: this.options.showClearButton && showSelection,
        showSelection: showSelection
      })
    );

    this._animateValue();

    return this;
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
    this.listenTo(this._timeSeriesModel, 'change:title', this.render);
    this.listenTo(this._dataviewModel, 'change:totalAmount', this._animateValue);
    this.listenTo(this._rangeFilter, 'change', this.render);
  },

  _onClick: function () {
    this.trigger('resetFilter', this);
  }
});
