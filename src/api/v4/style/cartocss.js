var _ = require('underscore');
var Base = require('./base');
var CartoValidationError = require('../error-handling/carto-error');

/**
 * A CartoCSS/TurboCarto style that can be applied to a {@link carto.layer.Layer}.
 * @param {string} cartocss CartoCSS
 * @example
 * var style = new carto.style.CartoCSS(`
 *   #layer {
 *     marker-fill: #FABADA;
 *     marker-width: 10;
 *   }
 * `);
 * @constructor
 * @extends carto.style.Base
 * @memberof carto.style
 * @api
 */
function CartoCSS (cartoCSS) {
  _checkCartoCSS(cartoCSS);
  this._cartoCSS = cartoCSS;
}

CartoCSS.prototype = Object.create(Base.prototype);

CartoCSS.prototype.toCartoCSS = function () {
  return this._cartoCSS;
};

/**
 * Get the current CartoCSS/TurboCarto style as a string.
 * 
 * @return {string} - The TurboCarto style for this CartoCSS object
 * @api
 */
CartoCSS.prototype.getStyle = function () {
  return this._cartoCSS;
};

function _checkCartoCSS (cartoCSS) {
  if (!cartoCSS) {
    throw new CartoValidationError('style', 'requiredCSS');
  }

  if (!_.isString(cartoCSS)) {
    throw new CartoValidationError('style', 'requiredCSSString');
  }
}

module.exports = CartoCSS;
