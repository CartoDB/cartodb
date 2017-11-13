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
 * Set time aggregation
 * 
 * @param {carto.dataview.timeAggregation} aggregation
 * @return {carto.dataview.TimeSeries} this
 * @api
 */
TimeSeries.prototype.setTimeAggregation = function (aggregation) {
  this._validateAggregation(aggregation);
  this._changeProperty('aggregation', aggregation);
  return this;
};

/**
 * Return the current time aggregation
 * 
 * @return {carto.dataview.timeAggregation} Current time aggregation
 * @api 
 */
TimeSeries.prototype.getTimeAggregation = function () {
  return this._aggregation;
};

/**
 * Set time offset
 * 
 * @param {number} offset
 * @return {carto.dataview.TimeSeries} this
 * @api
 */
TimeSeries.prototype.setOffset = function (offset) {
  this._validateOffset(offset);
  var prevOffset = this._offset;
  this._offset = offset;
  if (this._internalModel) {
    this._internalModel.set('offset', hoursToSeconds(offset));
  } else if (prevOffset !== offset) {
    this._triggerChange('offset', offset);
  }
  return this;
};

/**
 * Return the current time offset
 * 
 * @return {number} Current time offset
 * @api 
 */
TimeSeries.prototype.getOffset = function () {
  return this._offset;
};

/**
 * Set the local timezone flag. If enabled, the time offset is overriden by the use local timezone
 * 
 * @param {boolean} localTimezone
 * @return {carto.dataview.TimeSeries} this
 * @api
 */
TimeSeries.prototype.setLocalTimezone = function (localTimezone) {
  this._validateLocalTimezone(localTimezone);
  this._changeProperty('localTimezone', localTimezone);
  return this;
};

/**
 * Return the current local timezone flag
 * 
 * @return {boolean} Current local timezone flag
 * @api 
 */
TimeSeries.prototype.getLocalTimezone = function () {
  return this._localTimezone;
};

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
  // Empty function
};

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
