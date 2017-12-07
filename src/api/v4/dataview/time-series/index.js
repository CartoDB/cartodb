var _ = require('underscore');
var Base = require('../base');
var HistogramDataviewModel = require('../../../../dataviews/histogram-dataview-model');
var parseTimeSeriesData = require('./parse-data');
var timeAggregation = require('../../constants').timeAggregation;
var isValidTimeAggregation = require('../../constants').isValidTimeAggregation;

/**
 * A dataview to represent an histogram of temporal data allowing to specify the granularity of the temporal-bins.
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data
 * @param {string} column - The column name to get the data
 * @param {object} [options]
 * @param {carto.dataview.timeAggregation} [options.aggregation=auto] - Granularity of time aggregation
 * @param {number} [options.offset] - Amount of hours to displace the aggregation from UTC
 * @param {boolean} [options.useLocalTimezone] - Indicates to use the user local timezone or not
 *
 * @fires carto.dataview.TimeSeries.dataChanged
 * @fires carto.dataview.TimeSeries.aggregationChanged
 * @fires carto.dataview.TimeSeries.localTimezoneChanged
 * @fires carto.dataview.TimeSeries.offsetChanged
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 * @example
 * // We have a tweets dataset and we want to show a "per hour histogram" with the data.
 * var timeSeries = new carto.dataview.TimeSeries(source0, 'last_review', {
 *  offset: 0,
 *  aggregation: 'hour'
 * });
 * @example
 * // You can listen to multiple events emmited by the time-series-dataview.
 * // Data and status are fired by all dataviews.
 * timeSeries.on('dataChanged', newData => { });
 * timeSeries.on('statusChanged', (newData, error) => { });
 * timeSeries.on('error', cartoError => { });
 */
function TimeSeries (source, column, options) {
  this._initialize(source, column, options);
  this._aggregation = this._options.aggregation;
  this._offset = _hoursToSeconds(this._options.offset);
  this._localTimezone = this._options.useLocalTimezone;
}

TimeSeries.prototype = Object.create(Base.prototype);

TimeSeries.prototype.DEFAULTS = {
  aggregation: timeAggregation.AUTO,
  offset: 0,
  useLocalTimezone: false
};

/**
 * Return the resulting data.
 *
 * @return {carto.dataview.TimeSeriesData}
 * @api
 */
TimeSeries.prototype.getData = function () {
  if (this._internalModel) {
    return parseTimeSeriesData(
      this._internalModel.get('data'),
      this._internalModel.get('nulls'),
      this._internalModel.get('totalAmount'),
      this._internalModel.getCurrentOffset()
    );
  }
  return null;
};

/**
 * Set time aggregation.
 *
 * @param {carto.dataview.timeAggregation} aggregation
 * @fires carto.dataview.TimeSeries.aggregationChanged
 * @return {carto.dataview.TimeSeries} this
 * @api
 */
TimeSeries.prototype.setAggregation = function (aggregation) {
  this._validateAggregation(aggregation);
  this._changeProperty('aggregation', aggregation);
  return this;
};

/**
 * Return the current time aggregation.
 *
 * @return {carto.dataview.timeAggregation} Current time aggregation
 * @api
 */
TimeSeries.prototype.getAggregation = function () {
  return this._aggregation;
};

/**
 * Set time offset in hours.
 *
 * @param {number} offset
 * @fires carto.dataview.TimeSeries.offsetChanged
 * @return {carto.dataview.TimeSeries} this
 * @api
 */
TimeSeries.prototype.setOffset = function (offset) {
  this._validateOffset(offset);
  this._changeProperty('offset', _hoursToSeconds(offset));
  return this;
};

/**
 * Return the current time offset in hours.
 *
 * @return {number} Current time offset
 * @api
 */
TimeSeries.prototype.getOffset = function () {
  return _secondsToHours(this._offset);
};

/**
 * Set the local timezone flag. If enabled, the time offset is overriden by the use local timezone.
 *
 * @param {boolean} localTimezone
 * @return {carto.dataview.TimeSeries} this
 * @api
 */
TimeSeries.prototype.useLocalTimezone = function (enable) {
  this._validateLocalTimezone(enable);
  this._changeProperty('localTimezone', enable);
  return this;
};

/**
 * Return the current local timezone flag.
 *
 * @return {boolean} Current local timezone flag
 * @api
 */
TimeSeries.prototype.isUsingLocalTimezone = function () {
  return this._localTimezone;
};

TimeSeries.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw this._getValidationError('timeSeriesOptionsRequired');
  }
  this._validateAggregation(options.aggregation);
  this._validateOffset(options.offset);
  this._validateLocalTimezone(options.useLocalTimezone);
};

TimeSeries.prototype._validateAggregation = function (aggregation) {
  if (!isValidTimeAggregation(aggregation)) {
    throw this._getValidationError('timeSeriesInvalidAggregation');
  }
};

TimeSeries.prototype._validateOffset = function (offset) {
  if (!_.isFinite(offset) || Math.floor(offset) !== offset || offset < -12 || offset > 14) {
    throw this._getValidationError('timeSeriesInvalidOffset');
  }
};

TimeSeries.prototype._validateLocalTimezone = function (localTimezone) {
  if (!_.isBoolean(localTimezone)) {
    throw this._getValidationError('timeSeriesInvalidUselocaltimezone');
  }
};

TimeSeries.prototype._createInternalModel = function (engine) {
  this._internalModel = new HistogramDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    aggregation: this._aggregation,
    offset: this._offset,
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

// Utility functions 

function _hoursToSeconds (hours) {
  return hours * 3600;
}

function _secondsToHours (seconds) {
  return seconds / 3600;
}
module.exports = TimeSeries;

/**
 * Event triggered when the totals data in a time-series-dataview changes.
 *
 * Contains a single argument with the new data.
 *
 * @event carto.dataview.TimeSeries.dataChanged
 * @type {carto.dataview.TimeSeriesData}
 * @api
 */

/**
 * Event triggered when the aggregation in a TimeSeries-dataview changes.
 *
 * Contains a single argument with new aggregation.
 *
 * @event carto.dataview.TimeSeries.aggregationChanged
 * @type {string}
 * @api
 */

/**
 * Event triggered when the timezone in a TimeSeries-dataview changes.
 *
 * Contains a single boolean argument (???).
 *
 * @event carto.dataview.TimeSeries.localTimezoneChanged
 * @type {boolean}
 * @api
 */

/**
 * Event triggered when the offset in a TimeSeries-dataview changes.
 *
 * Contains a single string argument with the new offset
 *
 * @event carto.dataview.TimeSeries.offsetChanged
 * @type {string}
 * @api
 */
