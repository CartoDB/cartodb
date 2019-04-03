var Category = require('./category');
var Formula = require('./formula');
var Histogram = require('./histogram');
var TimeSeries = require('./time-series');
var status = require('../constants').status;
var timeAggregation = require('../constants').timeAggregation;

/**
 * @namespace carto.dataview
 * @api
 */
module.exports = {
  Category: Category,
  Formula: Formula,
  Histogram: Histogram,
  TimeSeries: TimeSeries,
  status: status,
  timeAggregation: timeAggregation
};
