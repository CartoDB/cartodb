var Base = require('./base');

/**
 * Metadata type buckets
 *
 * Adding a Turbocarto ramp (with ranges) in the style generates a response
 * from the server with the resulting information, after computing the ramp.
 * This information is wrapped in a metadata object of type 'buckets', that
 * contains a list of buckets with the range (min, max) and the value. And
 * also the total min, max range and the average of the total values.
 *
 * For example, the following ramp will generate a metadata of type 'buckets'
 * with numeric values (the size) in its buckets:
 *
 *   marker-width: ramp([scalerank], range(5, 20), quantiles(5));
 *
 * In another example, this ramp will generate a metadata of type 'buckets'
 * with string values (the color) in its buckets:
 *
 *   marker-fill: ramp([scalerank], (#FFC6C4, #EE919B, #CC607D), quantiles);
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

  Base.call(this, 'buckets', rule);
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
