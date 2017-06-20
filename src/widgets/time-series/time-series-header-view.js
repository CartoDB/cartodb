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

  options: {
    showClearButton: true
  },

  initialize: function (opts) {
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');
    if (!opts.rangeFilter) throw new Error('rangeFilter is required');
    if (!opts.timeSeriesModel) throw new Error('timeSeriesModel is required');

    this._timeSeriesModel = opts.timeSeriesModel;
    this._dataviewModel = opts.dataviewModel;
    this._layer = this._dataviewModel.layer;
    this._initBinds();
  },

  render: function () {
    var title = this._timeSeriesModel.get('title');

    this.$el.html(
      template({
        title: title,
        showClearButton: this.options.showClearButton
      })
    );

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._timeSeriesModel, 'change:title', this.render);
  },


  _onClick: function () {
    this.trigger('resetFilter', this);
  }
});
