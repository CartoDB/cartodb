var _ = require('underscore');
/**
 * Constants module for dataviews
 */

var OPERATION = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MAX: 'max',
  MIN: 'min'
};

var STATUS = {
  NOT_LOADED: 'notLoaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

function isValidOperation (operation) {
  return _.contains(OPERATION, operation);
}

function validOperations () {
  return _.toArray(OPERATION).join(', ');
}

module.exports = {
  OPERATION: OPERATION,
  STATUS: STATUS,
  isValidOperation: isValidOperation,
  validOperations: validOperations
};
