var Base = require('./base');

/**
 * @param {string} cartocss CartoCSS
 *
 * @example
 *
 * var style = new carto.style.CartoCSS(`
 *   #layer {
 *     marker-fill: #FABADA;
 *     marker-width: 10;
 *   }
 * `);
 *
 * @constructor
 * @extends carto.style.Base
 * @memberof carto.style
 * @api
 *
 */
function CartoCSS (cartocss) {
  this.cartocss = cartocss;
}

CartoCSS.prototype = Object.create(Base.prototype);

CartoCSS.prototype.toCartoCSS = function () {
  return this.cartocss;
};

module.exports = CartoCSS;
