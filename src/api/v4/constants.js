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

function isValidOperation (op) {
  return _.contains(operation, op);
}

module.exports = {
  operation: operation,
  status: status,
  isValidOperation: isValidOperation
};
