var _ = require('underscore');

var VALID_OPERATIONS = {
  avg: true,
  sum: true,
  min: true,
  max: true
};

var VALID_PLACEMENTS = {
  'point-sample': true,
  'point-grid': true,
  'centroid': true
};

function Aggregation (opts) {
  if (!opts.threshold) {
    throw new Error('Aggregation must have a threshold.');
  }

  if (!_.isFinite(opts.threshold) || opts.threshold < 1 || Math.floor(opts.threshold) !== opts.threshold) {
    throw new Error('Aggregation.threshold must have be a positive integer.');
  }

  if (!opts.resolution) {
    throw new Error();
  }

  if (!_.isFinite(opts.resolution) || opts.resolution < 1 || opts.resolution > 16) {
    throw new Error();
  }

  if (!opts.placement) {
    throw new Error();
  }

  if (!VALID_PLACEMENTS[opts.placement]) {
    throw new Error();
  }

  _checkColumns(opts.columns);

  return {
    threshold: opts.threshold,
    resolution: opts.resolution,
    placement: opts.placement,
    columns: opts.column
  };
}

function _checkColumns (columns) {
  if (!columns) {
    throw new Error();
  }

  Object.keys(columns).forEach(function (key) {
    _checkColumn(columns[key]);
  });
}

function _checkColumn (column) {
  if (!column.aggregated_column) {
    throw new Error('aggregate column is not defined');
  }

  if (!_.isString(column.aggregated_column)) {
    throw new Error('aggregate column is not a string');
  }

  if (!column.aggregate_function) {
    throw new Error('af is not defined');
  }

  if (!VALID_OPERATIONS[column.aggregate_function]) {
    throw new Error('af is not a valid funcion');
  }
}
module.exports = Aggregation;
