var _ = require('underscore');
/**
 * Constants module for dataviews
 */

/**
 * Enum for operation values.
 *
 * @enum {string} carto.operation
 * @readonly
 * @memberof carto
 * @api
 */
var operation = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MAX: 'max',
  MIN: 'min'
};

function isValidOperation (op) {
  return _.contains(operation, op);
}

/**
 * Enum for dataview status values.
 *
 * @enum {string} carto.dataview.status
 * @readonly
 * @memberof carto.dataview
 * @api
 */
var status = {
  NOT_LOADED: 'notLoaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

/**
 * Enum for dataview time aggregations.
 * 
 * @enum {string} carto.dataview.timeAggregation
 * @readonly
 * @memberOf carto.dataview
 * @api
 */

var timeAggregation = {
  AUTO: 'auto',
  YEAR: 'year',
  QUARTER: 'quarter',
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  HOUR: 'hour',
  MINUTE: 'minute',
  SECOND: 'second'
};

function isValidTimeAggregation (agg) {
  return _.contains(timeAggregation, agg);
}

module.exports = {
  operation: operation,
  status: status,
  timeAggregation: timeAggregation,
  isValidOperation: isValidOperation,
  isValidTimeAggregation: isValidTimeAggregation
};
