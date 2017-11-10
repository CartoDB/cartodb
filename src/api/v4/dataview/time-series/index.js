var _ = require('underscore');
var Base = require('../base');
var HistogramDataviewModel = require('../../../../dataviews/histogram-dataview-model');
var timeAggregation = require('../../constants').timeAggregation;
var isValidTimeAggregation = require('../../constants').isValidTimeAggregation;

function hoursToSeconds (hours) {
  return hours * 3600;
}

/**
 * Time-Series dataview object
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param {object} options
 * @param {carto.dataview.timeAggregation} [options.aggregation=auto] - Granularity of time aggregation.
 * @param {number} offset - Amount of hours to displace the aggregation from UTC.
 * @param {boolean} localTimezone - Indicates to use the user local timezone or not.
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 */
function TimeSeries (source, column, options) {
  this._initialize(source, column, options);
  this._aggregation = this._options.aggregation;
  this._offset = this._options.offset;
  this._localTimezone = this._options.localTimezone;
}

TimeSeries.prototype = Object.create(Base.prototype);

TimeSeries.prototype.DEFAULTS = {
  aggregation: timeAggregation.AUTO,
  offset: 0,
  localTimezone: false
};

/**
 * Return the resulting data
 *
 * @return {TimeSeriesData}
 * @api
 */
TimeSeries.prototype.getData = function () {
  if (this._internalModel) {
    console.warn('To be implemented: getData');
  }
  return null;
};

/**
 * Set number of bins
 * 
 * @param {number} bins
 * @return {carto.dataview.Histogram} this
 * @api
 */
// Histogram.prototype.setBins = function (bins) {
//   this._validateBins(bins);
//   this._changeProperty('bins', bins);
//   return this;
// };

/**
 * Return the current number of bins
 * 
 * @return {number} Current number of bins
 * @api 
 */
// Histogram.prototype.getBins = function () {
//   return this._bins;
// };

// Histogram.prototype._parseData = function (data, nulls, totalAmount) {
//   return parseHistogramData(data, nulls, totalAmount);
// };

TimeSeries.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw new TypeError('Options object to create a histogram dataview is required.');
  }
  this._validateAggregation(options.aggregation);
  this._validateOffset(options.offset);
  this._validateLocalTimezone(options.localTimezone);
};

TimeSeries.prototype._validateAggregation = function (aggregation) {
  if (!isValidTimeAggregation(aggregation)) {
    throw new TypeError('Time aggregation must be a valid value. Use carto.dataview.timeAggregation.');
  }
};

TimeSeries.prototype._validateOffset = function (offset) {
  if (!_.isFinite(offset) || Math.floor(offset) !== offset || offset < -12 || offset > 14) {
    throw new TypeError('Offset must an integer value between -12 and 14.');
  }
};

TimeSeries.prototype._validateLocalTimezone = function (localTimezone) {
  if (!_.isBoolean(localTimezone)) {
    throw new TypeError('LocalTimezone must be a boolean value.');
  }
};

TimeSeries.prototype._listenToInternalModelSpecificEvents = function () {
  console.warn('To be implemented: _listenToInternalModelSpecificEvents');
};

// Histogram.prototype._onBinsChanged = function () {
//   this._bins = this._internalModel.get('bins');
//   this._triggerChange('bins', this._bins);
// };

TimeSeries.prototype._createInternalModel = function (engine) {
  this._internalModel = new HistogramDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    aggregation: this._aggregation,
    offset: hoursToSeconds(this._offset),
    localTimezone: this._localTimezone,
    sync_on_data_change: true,
    sync_on_bbox_change: !!this._boundingBoxFilter,
    enabled: this._enabled,
    column_type: 'date'
  }, {
    engine: engine,
    bboxFilter: this._boundingBoxFilter && this._boundingBoxFilter.$getInternalModel()
  });
};

module.exports = TimeSeries;
