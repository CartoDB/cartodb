var d3 = require('d3')
var cdb = require('cartodb.js')
var template = require('./torque-time-info.tpl')

/**
 * View rendering the current step time
 *
 * this.model is expected to be a torque layer model
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-timeSeriesTimeInfo',

  initialize: function () {
    this.model.bind('change:step', this.render, this)

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M')
    this._dateFormatter = d3.time.format('%x')
  },

  render: function () {
    var date = this.model.get('time')

    this.$el.html(
      isNaN(date && date.getTime())
        ? ''
        : template({
          time: this._timeFormatter(date),
          date: this._dateFormatter(date)
        })
    )

    return this
  }
})
