var _ = require('underscore');
var Base = require('./base');
var BoundingBoxFilterModel = require('../../../windshaft/filters/bounding-box');
var CartoValidationError = require('../error-handling/carto-validation-error');

/**
 * Generic bounding box filter.
 *
 * When this filter is included into a dataview only the data inside a custom bounding box will be taken into account.
 * 
 * You can manually set the bounds via the `.setBounds()` method.
 * 
 * This filter could be useful if you want give the users to ability to select a portion of the map and update the dataviews accordingly.
 * 
 * @fires boundsChanged
 *
 * @constructor
 * @fires boundsChanged
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
 * Set the bounds.
 *
 * @param  {carto.filter.Bounds} bounds
 * @fires boundsChanged
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
 * Reset the bounds.
 *
 * @fires boundsChanged
 * @return {carto.filter.BoundingBox} this
 * @api
 */
BoundingBox.prototype.resetBounds = function () {
  return this.setBounds({ west: 0, south: 0, east: 0, north: 0 });
};

/**
 * Return the current bounds.
 *
 * @return {carto.filter.Bounds} Current bounds
 * @api
 */
BoundingBox.prototype.getBounds = function () {
  /**
   * @typedef {object} carto.filter.Bounds
   * @property {number} west - West coordinate
   * @property {number} south - South coordinate
   * @property {number} east - East coordinate
   * @property {number} north - North coordinate
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
    throw new CartoValidationError('filter', 'invalidBoundsObject');
  }
};

BoundingBox.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = BoundingBox;
