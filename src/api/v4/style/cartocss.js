function CartoCSS (cartocss) {
  this.cartocss = cartocss;
}

CartoCSS.prototype.toCartoCSS = function () {
  return this.cartocss;
};

module.exports = CartoCSS;
