var StyleBase = require('./base');

function StyleCartoCSS (cartocss) {
  this.cartocss = cartocss;
}

StyleCartoCSS.prototype = Object.create(StyleBase.prototype);

StyleCartoCSS.prototype.toCartoCSS = function () {
  return this.cartocss;
};

module.exports = StyleCartoCSS;
