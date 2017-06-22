var d3 = require('d3');
var cdb = require('cartodb.js');
var timeTemplate = require('./torque-time-info.tpl');
var numberTemplate = require('./torque-number-info.tpl');
// for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
var FORMATTER_TYPES = {
  'number': d3.format(',.0f'),
  'time': d3.time.format('%H:%M'),
  'date': d3.time.format('%x')
};

/**
 * View rendering the current step time
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-timeSeriesTimeInfo',

  initialize: function (opts) {
    if (!opts.torqueLayerModel) throw new Error('torqueLayerModel is required');
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');

    this._torqueLayerModel = this.options.torqueLayerModel;
    this._dataviewModel = this.options.dataviewModel;

    this._initBinds();
  },

  render: function () {
    var data = this._dataviewModel.get('data');
    var time = this._torqueLayerModel.get('time');
    var step = this._torqueLayerModel.get('step');
    var columnType = this._torqueLayerModel.get('column_type');
    var template = columnType === 'number' ? numberTemplate : timeTemplate;
    var scale = d3.scale.linear()
      .domain([0, data.length])
      .range([this._dataviewModel.get('start'), this._dataviewModel.get('end')]);
    var html = '';

    if (columnType === 'number') {
      html = template({
        number: FORMATTER_TYPES['number'](scale(step))
      });
    } else if (columnType === 'date' && !isNaN(time && time.getTime())) {
      html = template({
        time: FORMATTER_TYPES['time'](time),
        date: FORMATTER_TYPES['date'](time)
      });
    }

    this.$el.html(html);

    return this;
  },

  _initBinds: function () {
    this._torqueLayerModel.bind('change:step', this.render, this);
    this.add_related_model(this._torqueLayerModel);
  }
});
