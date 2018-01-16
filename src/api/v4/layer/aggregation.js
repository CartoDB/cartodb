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

/**
 * An aggregation can be passed to a {@link carto.layer.Layer} to reduce the number of visible points 
 * increasing the performance.
 * 
 * See {@link https://carto.com/docs/carto-engine/maps-api/tile-aggregation} for more info.
 * 
 * @param {object} opts 
 * @param {number} opts.threshold - The minimum number of rows in the dataset for aggregation to be applied
 * @param {number} opts.resolution - The cell-size of the spatial aggregation grid [more info]{@link https://carto.com/docs/carto-engine/maps-api/tile-aggregation/#resolution}
 * @param {string} opts.placement - The kind of [aggregated geometry]{@link https://carto.com/docs/carto-engine/maps-api/tile-aggregation/#placement} generated
 * @param {object} opts.columns - The new columns are computed by a applying an aggregate function to all the points in each group
 * @param {string} opts.columns.aggregatedFunction - The Function used to aggregate the points: avg (average), min (minimum), max (maximum) and mode (the most frequent value in the group)
 * @param {string} opts.columns.aggregatedColumn - The name of the original column to be aggregated.
 * 
 * @example
 * // Create a layer with aggregated data.
 * const aggregationOptions = {
 *   // Always apply aggregation
 *   threshold: 1,
 *   // 
 *   resolution: 1,
 *   // New points will be displayed at the center of the grid
 *   placement: 'point-grid',
 *   columns: {
 *     // The key is the name of the new generated column
 *     agg_population: {
 *     // Points will display the average of the aggregated data.
 *     aggregateFunction: 'avg',
 *     // The column to be aggregated
 *     aggregatedColumn: 'population'
 *    },
 *   }
 * };
 * const aggregation = new Aggregation(options);
 * const layer = new carto.layer.Layer(source, style, { aggregation: aggregation });
 * 
 * @constructor
 * @api
 * @memberof carto.layer
 */
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
