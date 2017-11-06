/**
 * Histogram dataview object
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param {object} options
 * @param {number} options.bins - Number of bins to aggregate the data range into. Default: 10
 * @param {number} options.start - The point where the aggregation starts. Optional, but if present, `end` option must be provided too.
 * @param {number} options.end - The point where the aggregation ends. Optional, but if present, `start` option must be provided too.
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 */
function Histogram (source, column, options) {
  this._initialize(source, column, options);
}

