var _ = require('underscore');
var Base = require('../base');
var HistogramDataviewModel = require('../../../../dataviews/histogram-dataview-model');
var parseHistogramData = require('./parse-data.js');

/**
 * A histogram is used to represent the distribution of numerical data.
 *
 * See {@link https://en.wikipedia.org/wiki/Histogram}.
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data
 * @param {string} column - The column name to get the data
 * @param {object} [options]
 * @param {number} [options.bins=10] - Number of bins to aggregate the data range into
 * @param {number} [options.start] - Lower limit of the data range, if not present, the lower limit of the actual data will be used. Start and end values must be used together.
 * @param {number} [options.end] - Upper limit of the data range, if not present, the upper limit of the actual data will be used. Start and end values must be used together.
 *
 * @fires dataChanged
 * @fires columnChanged
 * @fires statusChanged
 * @fires error
 *
 * @fires binsChanged
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 * @example
 * // Create a cities population histogram.
 * var histogram = new carto.dataview.Histogram(citiesSource, 'population');
 * // Set up a callback to render the histogram data every time new data is obtained.
 *  histogram.on('dataChanged', renderData);
 * // Add the histogram to the client
 * client.addDataview(histogram);
 * @example
 * // Create a cities population histogram with only 4 bins
 * var histogram = new carto.dataview.Histogram(citiesSource, 'population', {bins: 4});
 * // Add a bounding box filter, so the data will change when the map is moved.
 * var bboxFilter = new carto.filter.BoundingBoxLeaflet(map);
 * // Set up a callback to render the histogram data every time new data is obtained.
 *  histogram.on('dataChanged', histogramData => {
 *    console.log(histogramData);
 *  });
 * // Add the histogram to the client
 * client.addDataview(histogram);
 * @example
 * // Create a cities population histogram with a range
 * var histogram = new carto.dataview.Histogram(citiesSource, 'population', { start: 100000, end: 5000000 });
 * // Set up a callback to render the histogram data every time new data is obtained.
 *  histogram.on('dataChanged', histogramData => {
 *    console.log(histogramData);
 *  });
 * // Add the histogram to the client
 * client.addDataview(histogram);
 * @example
 * // The histogram is an async object so it can be on different states: LOADING, ERROR...
 * // Listen to state events
 * histogram.on('statusChanged', (newStatus, error) => { });
 * // Listen to histogram errors
 * histogram.on('error', error => { });
 */
function Histogram (source, column, options) {
  this._initialize(source, column, options);
  this._bins = this._options.bins;
  this._start = this._options.start;
  this._end = this._options.end;
}

Histogram.prototype = Object.create(Base.prototype);

Histogram.prototype.DEFAULTS = {
  bins: 10
};

/**
 * Return the resulting data.
 *
 * @return {carto.dataview.HistogramData}
 * @api
 */
Histogram.prototype.getData = function () {
  if (this._internalModel) {
    return parseHistogramData(
      this._internalModel.get('data'),
      this._internalModel.get('nulls'),
      this._internalModel.get('totalAmount')
    );
  }
  return null;
};

Histogram.prototype.setColumn = function (column) {
  Base.prototype.setColumn.apply(this, arguments);
  this._start = null;
  this._end = null;
};

/**
 * Set the number of bins.
 *
 * @param {number} bins
 * @fires binsChanged
 * @return {carto.dataview.Histogram} this
 * @api
 */
Histogram.prototype.setBins = function (bins) {
  this._validateBins(bins);
  this._changeProperty('bins', bins);
  return this;
};

/**
 * Return the current number of bins.
 *
 * @return {number} Current number of bins
 * @api
 */
Histogram.prototype.getBins = function () {
  return this._bins;
};

/**
 * Set the lower and upper limit of the bins range
 *
 * @param {number} start
 * @param {number} end
 * @return {carto.dataview.Histogram} this
 * @api
 */
Histogram.prototype.setStartEnd = function (start, end) {
  this._validateStartEnd(start, end);

  this._changeProperties({ start, end });

  return this;
};

/**
 * Return the lower limit of the bins' range
 *
 * @return {number} Current value of start
 * @api
 */
Histogram.prototype.getStart = function () {
  return this._start || this._internalModel.get('start');
};

/**
 * Return the upper limit of the bins' range
 *
 * @return {number} Current value of end
 * @api
 */
Histogram.prototype.getEnd = function () {
  return this._end || this._internalModel.get('end');
};

/**
 * Return the distribution type of the current data according to [Galtung’s AJUS System]{@link https://en.wikipedia.org/wiki/Multimodal_distribution#Galtung.27s_classification}
 *
 * @return {string} Distribution type of current data
 * @api
 */
Histogram.prototype.getDistributionType = function () {
  if (this._internalModel) {
    var data = this._internalModel.getData();
    return this._internalModel.getDistributionType(data);
  }
  return null;
};

Histogram.prototype._validateBins = function (bins) {
  if (!_.isFinite(bins) || bins < 1 || Math.floor(bins) !== bins) {
    throw this._getValidationError('histogramInvalidBins');
  }
};

Histogram.prototype._validateStartEnd = function (start, end) {
  const values = [start, end];

  if (_.every(values, _.isUndefined)) return;

  const bothAreNumbers = _.every(values, number => _.isNumber(number) && !_.isNaN(number));
  const bothAreNull = _.every(values, _.isNull);

  if (!bothAreNumbers && !bothAreNull) {
    throw this._getValidationError('histogramInvalidStartEnd');
  }
};

Histogram.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw this._getValidationError('histogramOptionsRequired');
  }
  this._validateBins(options.bins);
  this._validateStartEnd(options.start, options.end);
};

Histogram.prototype._createInternalModel = function (engine) {
  this._internalModel = new HistogramDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    bins: this._bins,
    start: this._start,
    end: this._end,
    sync_on_bbox_change: !!this._boundingBoxFilter,
    enabled: this._enabled,
    column_type: 'number'
  }, {
    engine: engine,
    bboxFilter: this._boundingBoxFilter && this._boundingBoxFilter.$getInternalModel()
  });
};

module.exports = Histogram;

/**
 * Fired when bins have changed. Handler gets a parameter with the new bins.
 *
 * @event binsChanged
 * @type {number}
 * @api
 */
