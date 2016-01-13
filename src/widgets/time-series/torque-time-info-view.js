var d3 = require('d3');
var cdb = require('cartodb.js');
var template = require('./torque-time-info.tpl');

/**
 * View rendering the current step time
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-timeSeriesTimeInfo',

  initialize: function () {
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._torqueLayerModel.bind('change:step', this.render, this);
    this.add_related_model(this._torqueLayerModel);

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M');
    this._dateFormatter = d3.time.format('%x');
  },

  render: function () {
    var date = this._torqueLayerModel.get('time');

    this.$el.html(
      isNaN(date && date.getTime())
        ? ''
        : template({
          time: this._timeFormatter(date),
          date: this._dateFormatter(date)
        })
    );

    return this;
  }
});
