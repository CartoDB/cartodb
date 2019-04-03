var _ = require('underscore');

/**
 * Transform the data obtained from an internal category dataview into a
 * public object.
 *
 * @param  {object[]} data
 * @param  {number} count
 * @param  {number} max
 * @param  {number} min
 * @param  {number} nulls
 * @param  {string} operation
 *
 * @return {carto.dataview.CategoryData} - The parsed and formatted data for the given parameters
 */
function parseCategoryData (data, count, max, min, nulls, operation) {
  if (!data) {
    return null;
  }
  /**
   * @typedef {object} carto.dataview.CategoryData
   * @property {number} count - The total number of categories
   * @property {number} max - Maximum category value
   * @property {number} min - Minimum category value
   * @property {number} nulls - Number of null categories
   * @property {string} operation - Operation used
   * @property {carto.dataview.CategoryItem[]} categories
   * @api
   */
  return {
    count: count,
    max: max,
    min: min,
    nulls: nulls,
    operation: operation,
    categories: _createCategories(data)
  };
}

/**
 * Transform the histogram raw data into {@link carto.dataview.CategoryItem}
 */
function _createCategories (data) {
  return _.map(data, function (item) {
    /**
     * @typedef {object} carto.dataview.CategoryItem
     * @property {boolean} group - Category is a group
     * @property {string} name - Category name
     * @property {number} value - Category value
     * @api
     */
    return {
      group: item.agg,
      name: item.name,
      value: item.value
    };
  });
}

module.exports = parseCategoryData;
