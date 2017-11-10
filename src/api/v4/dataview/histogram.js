var _ = require('underscore');
var Base = require('./base');
var HistogramDataviewModel = require('../../..//dataviews/histogram-dataview-model');

/**
 * Histogram dataview object
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param {object} options
 * @param {number} [options.bins=10] - Number of bins to aggregate the data range into.
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 */
function Histogram (source, column, options) {
  this._initialize(source, column, options);
  this._bins = this._options.bins;
}

Histogram.prototype = Object.create(Base.prototype);

Histogram.prototype.DEFAULTS = {
  bins: 10
};

/**
 * Return the resulting data
 *
 * @return {HistogramData}
 * @api
 */
Histogram.prototype.getData = function () {
  if (this._internalModel) {
    return this._parseData(this._internalModel.get('data'), this._internalModel.get('nulls'), this._internalModel.get('totalAmount'));
  }
  return null;
};

/**
 * Return the totals data (not affected by filters)
 *
 * @return {HistogramData}
 * @api
 */

Histogram.prototype.getTotalsData = function () {
  if (this._internalModel && this._internalModel.getUnfilteredData()) {
    var totals = this._internalModel.getUnfilteredDataModel();
    return this._parseData(this._internalModel.getUnfilteredData(), totals.get('nulls'), totals.get('totalAmount'));
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
Histogram.prototype.setBins = function (bins) {
  this._validateBins(bins);
  this._changeProperty('bins', bins);
  return this;
};

/**
 * Return the current number of bins
 * 
 * @return {number} Current number of bins
 * @api 
 */
Histogram.prototype.getBins = function () {
  return this._bins;
};

/**
 * Return the distribution type of the current data according to Galtung’s AJUS System https://en.wikipedia.org/wiki/Multimodal_distribution#Galtung.27s_classification
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

/**
 * Return the distribution type of the totals data according to Galtung’s AJUS System https://en.wikipedia.org/wiki/Multimodal_distribution#Galtung.27s_classification
 * 
 * @return {string} Distribution type of current data
 * @api 
 */
Histogram.prototype.getTotalsDistributionType = function () {
  if (this._internalModel) {
    var data = this._internalModel.getUnfilteredData();
    return this._internalModel.getDistributionType(data);
  }
  return null;
};

Histogram.prototype._validateBins = function (bins) {
  if (!_.isFinite(bins) || bins < 1 || Math.floor(bins) !== bins) {
    throw new TypeError('Bins must be a positive integer value.');
  }
};

Histogram.prototype._parseData = function (data, nulls, totalAmount) {
  if (data) {
    /**
     * @typedef {object} BinItem
     * @property {number} index
     * @property {number} min - Only appears if freq > 0
     * @property {number} max - Only appears if freq > 0
     * @property {number} avg - Only appears if freq > 0
     * @property {number} freq
     * @property {number} normalized
     * @memberof HistogramData
     * @api
     */
    /**
     * @typedef {object} HistogramData
     * @property {number} nulls
     * @property {number} totalAmount
     * @property {BinItem[]} result
     * @memberof carto.dataview.Histogram
     * @api
     */
    var maxFreq = _.max(data, function (bin) {
      return bin.freq || 0;
    }).freq;
    var result = data.map(function (bin) {
      return _.extend(bin, {
        normalized: _.isFinite(bin.freq)
          ? bin.freq / maxFreq
          : 0
      });
    });

    return {
      result: result,
      nulls: nulls || 0,
      totalAmount: totalAmount
    };
  }
  return null;
};

Histogram.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw new TypeError('Options object to create a histogram dataview is required.');
  }
  this._validateBins(options.bins);
};

Histogram.prototype._listenToInternalModelSpecificEvents = function () {
  this.listenTo(this._internalModel, 'change:bins', this._onBinsChanged);
};

Histogram.prototype._onBinsChanged = function () {
  this._bins = this._internalModel.get('bins');
  this._triggerChange('bins', this._bins);
};

Histogram.prototype._createInternalModel = function (engine) {
  this._internalModel = new HistogramDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    bins: this._bins,
    sync_on_data_change: true,
    sync_on_bbox_change: false,
    enabled: this._enabled,
    column_type: 'number'
  }, {
    engine: engine
  });
};

module.exports = Histogram;
