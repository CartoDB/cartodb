var _ = require('underscore');
/**
 * Constants module for dataviews
 */

var AGGREGATIONS = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MAX: 'max',
  MIN: 'min'
};

AGGREGATIONS.isValidAggregation = function (aggregation) {
  return _.contains(AGGREGATIONS, aggregation);
};

AGGREGATIONS.validValues = function () {
  return _.toArray(AGGREGATIONS).join(', ');
};

var STATUS = {
  NOT_LOADED: 'notLoaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

module.exports = {
  AGGREGATIONS: AGGREGATIONS,
  STATUS: STATUS
};
