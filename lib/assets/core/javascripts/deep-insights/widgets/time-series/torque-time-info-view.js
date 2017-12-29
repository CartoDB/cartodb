var d3 = require('d3');
var CoreView = require('backbone/core-view');
var moment = require('moment');
var formatter = require('../../formatter');
var template = require('./torque-time-info.tpl');

/**
 * View rendering the current step time
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-timeSeriesTimeInfo',

  initialize: function (opts) {
    if (!opts.torqueLayerModel) throw new Error('torqueLayerModel is required');
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');
    if (!opts.timeSeriesModel) throw new Error('timeSeriesModel is required');

    this._torqueLayerModel = this.options.torqueLayerModel;
    this._dataviewModel = this.options.dataviewModel;
    this._timeSeriesModel = this.options.timeSeriesModel;

    this._initBinds();
  },

  render: function () {
    var time = this._torqueLayerModel.get('time');
    var columnType = this._torqueLayerModel.get('column_type');
    var scale = d3.scale.linear()
      .domain([0, this._dataviewModel.get('data').length])
      .range([this._dataviewModel.get('start'), this._dataviewModel.get('end')]);
    var html = '';
    var timeFormatter = formatter.formatNumber;

    if (columnType === 'number') {
      html = template({
        time: timeFormatter(scale(this._torqueLayerModel.get('step')))
      });
    } else if (columnType === 'date' && !isNaN(time && time.getTime())) {
      timeFormatter = formatter.timestampFactory(this._dataviewModel.get('aggregation'), this._dataviewModel.getCurrentOffset());

      html = template({
        time: timeFormatter(moment(time).unix())
      });
    }

    this.$el.html(html);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._torqueLayerModel, 'change:step', this.render);
  }
});
