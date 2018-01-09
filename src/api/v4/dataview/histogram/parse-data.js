var _ = require('underscore');

/**
 * Transform the data obtained from an internal histogram dataview into a
 * public object.
 *
 * @param {object[]} data - The raw histogram data
 * @param {number} nulls - Number of data with a null
 * @param {number} totalAmount - Total number of data in the histogram
 *
 * @return {carto.dataview.HistogramData} - The parsed and formatted data for the given parameters
 */
function parseHistogramData (data, nulls, totalAmount) {
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
   * Object containing histogram data.
   *
   * @typedef {object} carto.dataview.HistogramData
   * @property {number} nulls - The number of items with null value
   * @property {number} totalAmount - The number of elements returned
   * @property {carto.dataview.BinItem[]} bins - Array containing the {@link carto.dataview.BinItem|data bins} for the histogram
   * @property {string} type - String with value: **histogram**
   * @api
   */
  return {
    bins: _createBins(compactData, maxFreq),
    nulls: nulls || 0,
    totalAmount: totalAmount
  };
}

/**
 * Transform the histogram raw data into {@link carto.dataview.BinItem}
 */
function _createBins (data, maxFreq) {
  return data.map(function (bin) {
    /**
     *  @example
     *  
     * // We created an histogram containing airBnb prices per night
     * const histogramDataview = new carto.dataview.Histogram(airbnbDataset, 'price', { bins: 7 });
     * // Listen to dataChanged events
     * histogramDataview.on('dataChanged', data => { 
     *  // The first bin contains prices from 0 to 20€ per night, there are 3 rentals in this bin with a cost of 10 15 and 20€.
     *  const bin = console.log(data.bins[0]);
     *  // This is the bin index in the bins array
     *  bin.index; // 0
     *  // The first bin contains rentals from 0 to 20€ per night
     *  bin.start; // 0
     *  // The first bin contains rentals from 0 to 20€ per night
     *  bin.end; // 20
     *  // The lower rental in the bin is 10€ per night
     *  bin.min; // 10
     *  // The maximun rental in the bin is 20€ per night
     *  bin.max; // 20
     *  // The average price in this bin is 15€ per night
     *  bin.avg; // 15
     *  // The bin contains 3 prices
     *  bin.freq; // 3
     *  // Those 3 prices represent the 20% of the dataset.
     *  bin.normalized; // 0.2
     * });
     * 
     * 
     * 
     *  
     * @typedef {object} carto.dataview.BinItem
     * @property {number} index - Number indicating the bin order
     * @property {number} start - The lower limit of the bin
     * @property {number} end - The higher limit of the bin
     * @property {number} min - The minimal value appearing in the bin. Only appears if freq > 0
     * @property {number} max - The minimal value appearing in the bin. Only appears if freq > 0
     * @property {number} avg - The average value of the elements for this bin. Only appears if freq > 0
     * @property {number} freq - Number of elements in the bin
     * @property {number} normalized - Normalized frequency with respect to the whole data
     * @api
     */
    return _.extend(bin, { normalized: _.isFinite(bin.freq) && maxFreq > 0 ? bin.freq / maxFreq : 0 });
  });
}

module.exports = parseHistogramData;
