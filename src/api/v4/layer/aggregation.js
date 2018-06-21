var _ = require('underscore');
var CartoValidationError = require('../error-handling/carto-validation-error');

/**
 * List of possible aggregation operations.
 * See {@link https://carto.com/developers/maps-api/tile-aggregation#columns } for more info.
 * @enum {string} carto.layer.Aggregation.operation
 * @memberof carto.layer.Aggregation
 * @api
 */
var OPERATIONS = {
  /** The new point will contain the average value of the or the aggregated ones */
  AVG: 'avg',
  /** The new point will contain the sum of the aggregated values */
  SUM: 'sum',
  /** The new point will contain the minimal value existing the aggregated features */
  MIN: 'min',
  /** The new point will contain the maximun value existing the aggregated features */
  MAX: 'max',
  /** The new point will contain the mode of the aggregated values */
  MODE: 'mode'
};

/**
 * List of possible aggregation feature placements.
 * See {@link https://carto.com/developers/maps-api/tile-aggregation#placement } for more info.
 * @enum {string} carto.layer.Aggregation.placement
 * @memberof carto.layer.Aggregation
 * @api
 */
var PLACEMENTS = {
  /** The new point will be placed at a random sample of the aggregated points */
  SAMPLE: 'point-sample',
  /** The new point will be placed at the center of the aggregation grid cells */
  GRID: 'point-grid',
  /** The new point will be placed at averaged coordinated of the grouped points */
  CENTROID: 'centroid'
};

var VALID_RESOLUTIONS = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256];

/**
 * An aggregation can be passed to a {@link carto.layer.Layer} to reduce the number of visible points 
 * increasing the performance.
 * 
 * See {@link https://carto.com/developers/maps-api/guides/tile-aggregation/} for more info.
 * 
 * @param {object} opts 
 * @param {number} opts.threshold - The minimum number of rows in the dataset for aggregation to be applied
 * @param {number} opts.resolution - The cell-size of the spatial aggregation grid [more info]{@link https://carto.com/developers/maps-api/tile-aggregation#resolution}
 * @param {string} opts.placement - The kind of [aggregated geometry]{@link https://carto.com/developers/maps-api/tile-aggregation#placement} generated
 * @param {object} opts.columns - The new columns are computed by a applying an aggregate function to all the points in each group
 * @param {string} opts.columns.aggregatedFunction - The Function used to aggregate the points: avg (average), sum, min (minimum), max (maximum) and mode (the most frequent value in the group)
 * @param {string} opts.columns.aggregatedColumn - The name of the original column to be aggregated.
 * 
 * @example
 * // Create a layer with aggregated data.
 * const aggregationOptions = {
 *   // CARTO applies aggregation if your dataset has more than threshold rows. In this case, more than 1 row.
 *   threshold: 1,
 *   // Defines the cell-size of the aggregation grid. In this case, 1x1 pixel. 
 *   resolution: 1,
 *   // Where the new point will be placed. In this case, at the center of the grid.
 *   placement: carto.layer.Aggregation.placement.GRID,
 *   // Here we define the aggregated columns that we want to obtain.
 *   columns: {
 *     // Each property key is the name of the new generated column
 *     avg_population: {
 *       // The aggregated column will contain the average of the original data.
 *       aggregateFunction: carto.layer.Aggregation.operation.AVG,
 *       // The column to be aggregated
 *       aggregatedColumn: 'population'
 *     }, {
 *     min_population: {
 *       aggregateFunction: carto.layer.Aggregation.operation.MIN,
 *       aggregatedColumn: 'population'
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

  _checkValidPlacement(opts.placement);

  var columns = _checkAndTransformColumns(opts.columns);

  var aggregation = {
    threshold: opts.threshold,
    resolution: opts.resolution,
    placement: opts.placement,
    columns: columns
  };

  return _.pick(aggregation, _.identity); // Remove empty values
}

Aggregation.operation = OPERATIONS;

Aggregation.placement = PLACEMENTS;

function _checkColumns (columns) {
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

  if (!_.contains(_.values(OPERATIONS), columns[key].aggregateFunction)) {
    throw _getValidationError('invalidColumnFunction' + key);
  }
}

function _getValidationError (code) {
  return new CartoValidationError('aggregation', code);
}

// Windshaft uses snake_case for column parameters
function _checkAndTransformColumns (columns) {
  var returnValue = null;

  if (columns) {
    _checkColumns(columns);

    returnValue = {};
    Object.keys(columns).forEach(function (key) {
      returnValue[key] = _columnToSnakeCase(columns[key]);
    });
  }
  return returnValue;
}

// Windshaft uses snake_case for column parameters
function _columnToSnakeCase (column) {
  return {
    aggregate_function: column.aggregateFunction,
    aggregated_column: column.aggregatedColumn
  };
}

function _checkValidPlacement (placement) {
  if (placement && !_.contains(_.values(PLACEMENTS), placement)) {
    throw _getValidationError('invalidPlacement');
  }
}

module.exports = Aggregation;
