var cdb = require('cartodb.js');
var d3 = require('d3');
var template = require('./torque-render-range-info.tpl');

/**
 * View for to display info about a selected render range
 * this.model is expected to be a torqueLayer model
 */
module.exports = cdb.core.View.extend({
  initialize: function () {
    this._dataviewModel = this.options.dataviewModel;
    this._rangeFilter = this._dataviewModel.filter;
    this._setupScales();
    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      timeFormatter: this._timeFormatter,
      dateFormatter: this._dateFormatter,
      startDate: new Date(this._scale.invert(this._rangeFilter.get('min'))),
      endDate: new Date(this._scale.invert(this._rangeFilter.get('max')))
    }));

    return this;
  },

  _initBinds: function () {
    this._rangeFilter.bind('change', this.render, this);
    this.add_related_model(this._rangeFilter);
  },

  _setupScales: function () {
    var data = this._dataviewModel.get('data');
    var start = this._dataviewModel.get('start');
    var end = this._dataviewModel.get('end');

    this._scale = d3.time.scale()
      .domain([data[0].start * 1000, data[data.length - 1].end * 1000])
      .nice()
      .range([start, end]);

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M');
    this._dateFormatter = d3.time.format('%x');
  }
});
