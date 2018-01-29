var _ = require('underscore');
var CartoColor = require('cartocolor');

var COLORS_NUMBER_DEFAULT = 7;

module.exports = {
  getRamps: function (schemeNames, colorsNumber) {
    if (!schemeNames) { throw new Error('CartoColor scheme name is required'); }
    colorsNumber = colorsNumber || COLORS_NUMBER_DEFAULT;

    return _.map(schemeNames, function (schemeName) {
      return CartoColor[schemeName][colorsNumber];
    });
  }
};
