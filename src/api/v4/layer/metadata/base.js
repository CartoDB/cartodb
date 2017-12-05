/**
 * Base metadata object
 *
 * @constructor
 * @abstract
 * @memberof carto
 * @api
 */
function Base (type, column, mapping, property) {
  this._type = type || '';
  this._column = column;
  this._mapping = mapping;
  this._property = property;
}

/**
 * Return true is the metadata type is category
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isCategory = function () {
  return this._type === 'category';
};

/**
 * Return true is the metadata type is gradient
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isGradient = function () {
  return this._type === 'gradient';
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
