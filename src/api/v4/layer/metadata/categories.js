var Base = require('./base');

/**
 * Metadata type categories
 *
 * @param {object} rule - Rule with the cartocss metadata
 * @constructor
 * @hideconstructor
 * @memberof metadata
 * @api
 */
function Categories (rule) {
  var categoryBuckets = rule.getBucketsWithCategoryFilter();
  var defaultBuckets = rule.getBucketsWithDefaultFilter();

  /**
   * @typedef {object} metadata.Category
   * @property {string} name - The name of the category
   * @property {string} value - The value of the category
   * @api
   */
  this._categories = categoryBuckets.map(function (bucket) {
    return {
      name: bucket.filter.name,
      value: bucket.value
    };
  });
  this._defaultValue = defaultBuckets.length > 0 ? defaultBuckets[0].value : undefined;

  Base.call(this, 'categories', rule);
}

Categories.prototype = Object.create(Base.prototype);

/**
 * Return the buckets
 *
 * @return {Category[]}
 * @api
 */
Categories.prototype.getCategories = function () {
  return this._categories;
};

/**
 * Return the default value
 *
 * @return {string}
 * @api
 */
Categories.prototype.getDefaultValue = function () {
  return this._defaultValue;
};

module.exports = Categories;
