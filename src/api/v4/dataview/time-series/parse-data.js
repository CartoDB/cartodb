var _ = require('underscore');

function secondsToHours (seconds) {
  return seconds / 3600;
}

/**
 * Transform the data obtained from an internal timeseries dataview into a  public object.
 *
 * @param {object[]} data - The raw time series data
 * @param {number} nulls - Number of data with a null
 * @param {number} totalAmount - Total number of data in the histogram
 *
 * @return {TimeSeriesData} - The parsed and formatted data for the given parameters
 */
function parseTimeSeriesData (data, nulls, totalAmount, offset) {
  if (!data) {
    return null;
  }
  var compactData = _.compact(data);
  var maxBin = _.max(compactData, function (bin) { return bin.freq || 0; });
  var maxFreq = _.isFinite(maxBin.freq) && maxBin.freq !== 0
    ? maxBin.freq
    : null;

  /**
   * @description
   * Object containing time series data.
   *
   * @typedef {object} carto.dataview.TimeSeriesData
   * @property {number} nulls - The number of items with null value
   * @property {number} totalAmount - The number of elements returned
   * @property {number} offset - The time offset in hours. Needed to format UTC timestamps into the proper timezone format
   * @property {carto.dataview.TimeSeriesBinItem[]} bins - Array containing the {@link carto.dataview.TimeSeriesBinItem|data bins} for the time series
   * @api
   */
  return {
    bins: _createBins(compactData, maxFreq),
    nulls: nulls || 0,
    offset: secondsToHours(offset),
    totalAmount: totalAmount
  };
}

/**
 * Transform the time series raw data into {@link carto.dataview.TimeSeriesBinItem}.
 */
function _createBins (data, maxFreq) {
  return data.map(function (bin) {
    /**
      * @typedef {object} carto.dataview.TimeSeriesBinItem
      * @property {number} index - Number indicating the bin order
      * @property {number} start - Starting UTC timestamp of the bin
      * @property {number} end - End UTC timestamp of the bin
      * @property {number} min - Minimum UTC timestamp present in the bin. Only appears if freq > 0
      * @property {number} max - Maximum UTC timestamp present in the bin. Only appears if freq > 0
      * @property {number} freq - Numbers of elements present in the bin
      * @property {number} normalized - Normalized frequency with respect to the whole dataset
      * @api
      */
    return {
      index: bin.bin,
      start: bin.start,
      end: bin.end,
      min: bin.min,
      max: bin.max,
      freq: bin.freq,
      normalized: _.isFinite(bin.freq) && maxFreq > 0 ? bin.freq / maxFreq : 0
    };
  });
}

module.exports = parseTimeSeriesData;
