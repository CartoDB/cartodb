var d3 = require('d3');
var View = require('cdb/core/view');
var template = require('./torque-time-info.tpl');

/**
 * View rendering the current step time
 *
 * Model is expected to be a torque layer model
 */
module.exports = View.extend({

  className: 'Widget-timeSeriesTimeInfo',

  initialize: function() {
    this.model.bind('change:step', this.render, this);

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M');
    this._dateFormatter = d3.time.format('%x');
  },

  render: function() {
    var date = new Date(this.model.get('time'));
    this.$el.html(
      template({
        time: this._timeFormatter(date),
        date: this._dateFormatter(date)
      })
    );

    return this;
  }
});
