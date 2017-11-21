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
  /** Number of elements */
  COUNT: 'count',
  /** Sum */
  SUM: 'sum',
  /** Average */
  AVG: 'avg',
  /** Maximum */
  MAX: 'max',
  /** Minimum */
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
  /** Not fetched with the server */
  NOT_LOADED: 'notLoaded',
  /** Fetching with the server */
  LOADING: 'loading',
  /** Fetch completed */
  LOADED: 'loaded',
  /** Error in fetch */
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
  MINUTE: 'minute'
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
