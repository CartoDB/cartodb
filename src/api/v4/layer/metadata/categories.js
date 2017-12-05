var Base = require('./base');

/**
 * Metadata type categories
 *
 * @param {object} data - Rule with the cartocss metadata
 * @constructor
 * @hideconstructor
 */
function Categories (data) {
  _checkData(data);

  Base.call(this, 'gradient', data.column, data.mapping, data.prop);

  /**
   * @typedef {object} Category
   * @property {string} name - The name of the category
   * @property {string} value - The value of the category
   * @api
   */
  this._categories = data.buckets.map(function (bucket) {
    return {
      name: bucket.filter.name,
      value: bucket.value
    };
  });
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

function _checkData (data) {

}
