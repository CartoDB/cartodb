/**
 * Base metadata object
 *
 * @constructor
 * @abstract
 * @memberof carto.layer.metadata
 * @api
 */
function Base (type, rule) {
  this._type = type || '';
  this._column = rule.getColumn();
  this._mapping = rule.getMapping();
  this._property = rule.getProperty();
}

/**
 * Return true is the metadata type is categories
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isCategories = function () {
  return this._type === 'categories';
};

/**
 * Return true is the metadata type is buckets
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isBuckets = function () {
  return this._type === 'buckets';
};

/**
 * Return the column of the metadata
 *
 * @return {string}
 * @api
 */
Base.prototype.getColumn = function () {
  return this._column;
};

/**
 * Return the property of the metadata
 *
 * @return {string}
 * @api
 */
Base.prototype.getMapping = function () {
  return this._mapping;
};

/**
 * Return the property of the metadata
 *
 * @return {string}
 * @api
 */
Base.prototype.getProperty = function () {
  return this._property;
};

module.exports = Base;
