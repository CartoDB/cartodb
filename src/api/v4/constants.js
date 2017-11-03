var _ = require('underscore');
/**
 * Constants module for dataviews
 */

/**
 * Enum for operation values.
 *
 * @enum {string} carto.OPERATION
 * @readonly
 * @memberof carto
 * @api
 */
var OPERATION = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MAX: 'max',
  MIN: 'min'
};

/**
 * Enum for dataview status values.
 *
 * @enum {string} carto.dataview.STATUS
 * @readonly
 * @memberof carto.dataview
 * @api
 */
var STATUS = {
  NOT_LOADED: 'notLoaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

function isValidOperation (operation) {
  return _.contains(OPERATION, operation);
}

module.exports = {
  OPERATION: OPERATION,
  STATUS: STATUS,
  isValidOperation: isValidOperation
};
