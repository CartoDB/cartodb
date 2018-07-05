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
 * @memberof carto.dataview
 * @api
 */
var timeAggregation = {
  /** Auto */
  AUTO: 'auto',
  /** Millennium */
  MILLENNIUM: 'millennium',
  /** Century */
  CENTURY: 'century',
  /** Decade */
  DECADE: 'decade',
  /** Year */
  YEAR: 'year',
  /** Quarter */
  QUARTER: 'quarter',
  /** Month */
  MONTH: 'month',
  /** Week */
  WEEK: 'week',
  /** Day */
  DAY: 'day',
  /** Hour */
  HOUR: 'hour',
  /** Minute */
  MINUTE: 'minute'
};

function isValidTimeAggregation (agg) {
  return _.contains(timeAggregation, agg);
}

/**
 * ATTRIBUTION constant
 *
 * &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>
 *
 * @type {string}
 * @constant
 * @memberof carto
 * @api
 */
var ATTRIBUTION = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

module.exports = {
  operation: operation,
  status: status,
  timeAggregation: timeAggregation,
  isValidOperation: isValidOperation,
  isValidTimeAggregation: isValidTimeAggregation,
  ATTRIBUTION: ATTRIBUTION
};
