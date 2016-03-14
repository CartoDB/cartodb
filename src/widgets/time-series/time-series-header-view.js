var cdb = require('cartodb.js');
var template = require('./time-series-header.tpl');
var d3 = require('d3');

/**
 * View to reset render range.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-header--timeSeries js-header CDB-Widget-contentSpaced',
  events: {
    'click .js-clear': '_onClick'
  },

  initialize: function () {
    this._dataviewModel = this.options.dataviewModel;
    this._rangeFilter = this.options.rangeFilter;
    this._rangeFilter.bind('change', this.render, this);
    this._setupScales();
  },

  render: function () {
    this.$el.empty();
    if (!this._rangeFilter.isEmpty()) {
      this.$el.html(
        template({
          timeFormatter: this._timeFormatter,
          dateFormatter: this._dateFormatter,
          startDate: new Date(this._scale.invert(this._rangeFilter.get('min'))),
          endDate: new Date(this._scale.invert(this._rangeFilter.get('max')))
        })
      );
    }
    return this;
  },

  _setupScales: function () {
    var data = this._dataviewModel.get('data');
    this._scale = d3.time.scale()
      .domain([data[0].start * 1000, data[data.length - 1].end * 1000])
      .nice()
      .range([this._dataviewModel.get('start'), this._dataviewModel.get('end')]);

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M');
    this._dateFormatter = d3.time.format('%x');
  },

  _onClick: function () {
    this.trigger('resetFilter', this);
  }
});
