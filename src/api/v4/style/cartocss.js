var Base = require('./base');

function CartoCSS (cartocss) {
  this.cartocss = cartocss;
}

CartoCSS.prototype = Object.create(Base.prototype);

CartoCSS.prototype.toCartoCSS = function () {
  return this.cartocss;
};

module.exports = CartoCSS;
