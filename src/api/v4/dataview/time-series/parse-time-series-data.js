var _ = require('underscore');

/**
 * Transform the data obtained from an internal timeseries dataview into a 
 * public object.
 * 
 * @param {object[]} data - The raw time series data
 * @param {number} nulls - Number of data with a null
 * @param {number} totalAmount - Total number of data in the histogram.
 * 
 * @return {TimeSeriesData} - The parsed and formatted data for the given parameters.
 */
function parseTimeSeriesData (data, nulls, totalAmount) {
  if (!data) {
    return null;
  }
  var maxFreq = _.max(data, function (bin) { return bin.freq || 0; }).freq;

  /**
   * @description
   * #Object containing time series data.
   * 
   * @typedef {object} TimeSeriesData
   * @property {number} nulls - The number of items with null value.
   * @property {number} totalAmount - The number of elements returned.
   * @property {TimeSeriesBinItem[]} result - Array containing the {@link TimeSeriesBinItem|data bins} for the time series.
   * @api
   */
  return {
    result: _createResult(data, maxFreq),
    nulls: nulls || 0,
    totalAmount: totalAmount
  };
}

/**
 * Transform the time series raw data into {@link TimeSeriesBinItem}
 */
function _createResult (data, maxFreq) {
  return data.map(function (bin) {
    /** 
      * @typedef {object} TimeSeriesBinItem
      * @property {number} index - Number indicating the bin order.
      * @property {number} start - Starting timestamp of the bin.
      * @property {number} end - End timestamp of the bin.
      * @property {number} min - Minimum timestamp present in the bin. Only appears if freq > 0
      * @property {number} max - Maximum timestamp present in the bin. Only appears if freq > 0
      * @property {number} freq - Numbers of elements present in the bin
      * @property {number} normalized - Normalized frequency with respect to the whole data.
      * @api
      */
    return {
      index: bin.bin,
      start: bin.start,
      end: bin.end,
      min: bin.min,
      max: bin.max,
      freq: bin.freq,
      normalized: _.isFinite(bin.freq) ? bin.freq / maxFreq : 0
    };
  });
}

module.exports = parseTimeSeriesData;
