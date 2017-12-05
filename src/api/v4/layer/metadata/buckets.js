var Base = require('./base');

/**
 * Metadata type gradient
 *
 * @param {object} rule - Rule with the cartocss metadata
 * @constructor
 * @hideconstructor
 * @extends carto.layer.metadata.Base
 * @memberof carto.layer.metadata
 * @api
 */
function Buckets (rule) {
  var rangeBuckets = rule.getBucketsWithRangeFilter();

  /**
   * @typedef {object} carto.layer.metadata.Bucket
   * @property {number} min - The minimum range value
   * @property {number} max - The maximum range value
   * @property {number|string} value - The value of the bucket
   * @api
   */
  this._buckets = rangeBuckets.map(function (bucket) {
    return {
      min: bucket.filter.start,
      max: bucket.filter.end,
      value: bucket.value
    };
  });
  this._avg = rule.getFilterAvg();
  this._min = rangeBuckets.length > 0 ? rangeBuckets[0].filter.start : undefined;
  this._max = rangeBuckets.length > 0 ? rangeBuckets[rangeBuckets.length - 1].filter.end : undefined;

  Base.call(this, 'gradient', rule);
}

Buckets.prototype = Object.create(Base.prototype);

/**
 * Return the buckets
 *
 * @return {carto.layer.metadata.Bucket[]}
 * @api
 */
Buckets.prototype.getBuckets = function () {
  return this._buckets;
};

/**
 * Return the average of the column
 *
 * @return {number}
 * @api
 */
Buckets.prototype.getAverage = function () {
  return this._avg;
};

/**
 * Return the minimum value in the ranges
 *
 * @return {number}
 * @api
 */
Buckets.prototype.getMin = function () {
  return this._min;
};

/**
 * Return the maximum value in the ranges
 *
 * @return {number}
 * @api
 */
Buckets.prototype.getMax = function () {
  return this._max;
};

module.exports = Buckets;
