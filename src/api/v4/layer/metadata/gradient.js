var Base = require('./base');

/**
 * Metadata type gradient
 *
 * @param {object} data - Rule with the cartocss metadata
 * @constructor
 * @hideconstructor
 */
function Gradient (data) {
  _checkData(data);

  Base.call(this, 'gradient', data.column, data.mapping, data.prop);

  this._avg = data.stats.filter_avg;
  this._min = data.buckets.length > 0 ? data.buckets[0].filter.start : undefined;
  this._max = data.buckets.length > 0 ? data.buckets[data.buckets.length - 1].filter.end : undefined;
  /**
   * @typedef {object} Bucket
   * @property {number} min - The minimum range value
   * @property {number} max - The maximum range value
   * @property {number|string} value - The value of the bucket
   * @api
   */
  this._buckets = data.buckets.map(function (bucket) {
    return {
      min: bucket.filter.start,
      max: bucket.filter.end,
      value: bucket.value
    };
  });
}

Gradient.prototype = Object.create(Base.prototype);

/**
 * Return the average of the column
 *
 * @return {number}
 * @api
 */
Gradient.prototype.getAverage = function () {
  return this._avg;
};

/**
 * Return the minimum value in the ranges
 *
 * @return {number}
 * @api
 */
Gradient.prototype.getMin = function () {
  return this._min;
};

/**
 * Return the maximum value in the ranges
 *
 * @return {number}
 * @api
 */
Gradient.prototype.getMax = function () {
  return this._max;
};

/**
 * Return the buckets
 *
 * @return {Bucket[]}
 * @api
 */
Gradient.prototype.getBuckets = function () {
  return this._buckets;
};

function _checkData(data) {

}
