var _ = require('underscore');
var Base = require('./base');
var BoundingBoxFilterModel = require('../../../windshaft/filters/bounding-box');

/**
 * Bounding box filter
 *
 * @constructor
 * @extends carto.filter.Base
 * @memberof carto.filter
 * @api
 *
 */
function BoundingBox () {
  this._internalModel = new BoundingBoxFilterModel();
}

BoundingBox.prototype = Object.create(Base.prototype);

/**
 * Set the bounds
 *
 * @param  {carto.filter.Bounds} bounds
 * @return {carto.filter.BoundingBox} this
 * @api
 */
BoundingBox.prototype.setBounds = function (bounds) {
  this._checkBounds(bounds);
  this._internalModel.setBounds(bounds);
  this.trigger('boundsChanged', bounds);
  return this;
};

/**
 * Reset the bounds
 *
 * @return {carto.filter.BoundingBox} this
 * @api
 */
BoundingBox.prototype.resetBounds = function () {
  return this.setBounds({ west: 0, south: 0, east: 0, north: 0 });
};

/**
 * Return the current bounds
 *
 * @return {carto.filter.Bounds} Current bounds
 * @api
 */
BoundingBox.prototype.getBounds = function () {
  /**
   * @typedef {object} carto.filter.Bounds
   * @property {number} west
   * @property {number} south
   * @property {number} east
   * @property {number} north
   * @api
   */
  return this._internalModel.getBounds();
};

BoundingBox.prototype._checkBounds = function (bounds) {
  if (_.isUndefined(bounds) ||
      _.isUndefined(bounds.west) ||
      _.isUndefined(bounds.south) ||
      _.isUndefined(bounds.east) ||
      _.isUndefined(bounds.north) ||
      !_.isNumber(bounds.west) ||
      !_.isNumber(bounds.south) ||
      !_.isNumber(bounds.east) ||
      !_.isNumber(bounds.north)) {
    throw new TypeError('Bounds object is not valid. Use a carto.filter.Bounds object');
  }
};

BoundingBox.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = BoundingBox;
