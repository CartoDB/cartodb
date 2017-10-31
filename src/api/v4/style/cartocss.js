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
 * @api
 * @memberof carto.style
 *
 */
function CartoCSS (cartocss) {
  this.cartocss = cartocss;
}

CartoCSS.prototype.toCartoCSS = function () {
  return this.cartocss;
};

module.exports = CartoCSS;
