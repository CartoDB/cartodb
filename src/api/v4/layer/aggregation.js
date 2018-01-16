var _ = require('underscore');
var CartoValidationError = require('../error-handling/carto-validation-error');

// Taken from https://carto.com/docs/carto-engine/maps-api/tile-aggregation/#columns
var VALID_OPERATIONS = {
  avg: true,
  sum: true,
  min: true,
  max: true,
  mode: true
};

// Taken from https://carto.com/docs/carto-engine/maps-api/tile-aggregation/#placement
var VALID_PLACEMENTS = {
  'point-sample': true,
  'point-grid': true,
  'centroid': true
};

var VALID_RESOLUTIONS = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256];

function Aggregation (opts) {
  if (!_.isFinite(opts.threshold)) {
    throw _getValidationError('thresholdRequired');
  }

  if (!_.isFinite(opts.threshold) || opts.threshold < 1 || Math.floor(opts.threshold) !== opts.threshold) {
    throw _getValidationError('invalidThreshold');
  }

  if (!_.isFinite(opts.resolution)) {
    throw _getValidationError('resolutionRequired');
  }

  if (!_.contains(VALID_RESOLUTIONS, opts.resolution)) {
    throw _getValidationError('invalidResolution');
  }

  if (!opts.placement) {
    throw _getValidationError('placementRequired');
  }

  if (!VALID_PLACEMENTS[opts.placement]) {
    throw _getValidationError('invalidPlacement');
  }

  _checkColumns(opts.columns);

  return {
    threshold: opts.threshold,
    resolution: opts.resolution,
    placement: opts.placement,
    columns: opts.columns
  };
}

function _checkColumns (columns) {
  if (!columns) {
    throw new Error();
  }

  Object.keys(columns).forEach(function (key) {
    _checkColumn(columns, key);
  });
}

function _checkColumn (columns, key) {
  if (!columns[key].aggregatedColumn) {
    throw _getValidationError('columnAggregatedColumnRequired' + key);
  }

  if (!_.isString(columns[key].aggregatedColumn)) {
    throw _getValidationError('invalidColumnAggregatedColumn' + key);
  }

  if (!columns[key].aggregateFunction) {
    throw _getValidationError('columnFunctionRequired' + key);
  }

  if (!VALID_OPERATIONS[columns[key].aggregateFunction]) {
    throw _getValidationError('invalidColumnFunction' + key);
  }
}

function _getValidationError (code) {
  return new CartoValidationError('aggregation', code);
}
module.exports = Aggregation;
