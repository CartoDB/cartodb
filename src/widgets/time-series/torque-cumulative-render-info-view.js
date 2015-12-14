var View = cdb.core.View
var d3 = cdb.d3
var template = require('./torque-cumulative-render-info.tpl')

/**
 * View for to display info about the cumulative render data, e.g. the time range that's being displayed
 * this.model is expected to be a torqueLayer model
 */
module.exports = View.extend({
  initialize: function () {
    this._torqueLayerModel = this.options.torqueLayerModel

    var data = this.model.get('data')
    this._scale = d3.time.scale()
      .domain([data[0].start * 1000, data[data.length - 1].end * 1000])
      .nice()
      .range([0, this.model.get('bins')])

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M')
    this._dateFormatter = d3.time.format('%x')
  },

  render: function () {
    var cumulativeRender = this._torqueLayerModel.get('cumulativeRender')

    this.$el.html(template({
      timeFormatter: this._timeFormatter,
      dateFormatter: this._dateFormatter,
      startDate: new Date(this._scale.invert(cumulativeRender.start)),
      endDate: new Date(this._scale.invert(cumulativeRender.end))
    }))

    return this
  }
})
