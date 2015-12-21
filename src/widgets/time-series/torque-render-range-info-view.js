var cdb = require('cartodb.js');
var d3 = require('d3');
var template = require('./torque-render-range-info.tpl');

/**
 * View for to display info about a selected render range
 * this.model is expected to be a torqueLayer model
 */
module.exports = cdb.core.View.extend({
  initialize: function () {
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._torqueLayerModel.bind('change:renderRange', this.render, this);
    this.add_related_model(this._torqueLayerModel);

    var data = this.model.get('data');
    this._scale = d3.time.scale()
      .domain([data[0].start * 1000, data[data.length - 1].end * 1000])
      .nice()
      .range([0, this.model.get('bins')]);

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._timeFormatter = d3.time.format('%H:%M');
    this._dateFormatter = d3.time.format('%x');
  },

  render: function () {
    var renderRange = this._torqueLayerModel.get('renderRange');

    this.$el.html(template({
      timeFormatter: this._timeFormatter,
      dateFormatter: this._dateFormatter,
      startDate: new Date(this._scale.invert(renderRange.start)),
      endDate: new Date(this._scale.invert(renderRange.end))
    }));

    return this;
  }
});
