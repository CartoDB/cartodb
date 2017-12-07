var Base = require('./base');

/**
 * Metadata type categories
 *
 * Adding a Turbocarto ramp (with categories) in the style generates a response
 * from the server with the resulting information after computing the ramp.
 * This information is wrapped in a metadata object of type 'categories', that
 * contains a list of categories with the name of the category and the value. And
 * also the default value if it has been defined in the ramp.
 *
 * For example, the following ramp will generate a metadata of type 'categories'
 * with string values (the color) in its categories. The #CCCCCC is the default
 * value in this case:
 *
 *   marker-fill: ramp([scalerank], (#F54690, #D16996, #CCCCCC), (1, 2), "=", category);
 *
 * @param {object} rule - Rule with the cartocss metadata
 * @constructor
 * @hideconstructor
 * @extends carto.layer.metadata.Base
 * @memberof carto.layer.metadata
 * @api
 */
function Categories (rule) {
  var categoryBuckets = rule.getBucketsWithCategoryFilter();
  var defaultBuckets = rule.getBucketsWithDefaultFilter();

  /**
   * @typedef {object} carto.layer.metadata.Category
   * @property {number|string} name - The name of the category
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
 * @return {carto.layer.metadata.Category[]}
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
