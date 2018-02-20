var _ = require('underscore');
var CartoColors = require('cartocolor');

var Tags = {
  COLORBLIND: 'colorblind',
  DIVERGING: 'diverging',
  QUALITATIVE: 'qualitative',
  QUANTITATIVE: 'quantitative'
};

module.exports = {
  getColorRamps: function (colorsNumber) {
    if (!colorsNumber) { throw new Error('Number of colors per ramp is required'); }

    var rampColors = [];

    _.each(CartoColors, function (color) {
      if (color && color[colorsNumber]) {
        rampColors.push(color[colorsNumber]);
      }
    });

    return rampColors;
  },

  getColorRampsByTag: function (colorsNumber, tag) {
    if (!colorsNumber) { throw new Error('Number of colors per ramp is required'); }

    var rampColors = [];

    _.each(CartoColors, function (color) {
      if (color && color[colorsNumber] && _.contains(color.tags, tag)) {
        rampColors.push(color[colorsNumber]);
      }
    });

    return rampColors;
  },

  getColorblindRamps: function (colorsNumber) {
    return this.getColorRampsByTag(colorsNumber, Tags.COLORBLIND);
  },

  getDivergingRamps: function (colorsNumber) {
    return this.getColorRampsByTag(colorsNumber, Tags.DIVERGING);
  },

  getQualitativeRamps: function (colorsNumber) {
    return this.getColorRampsByTag(colorsNumber, Tags.QUALITATIVE);
  },

  getQuantitativeRamps: function (colorsNumber) {
    return this.getColorRampsByTag(colorsNumber, Tags.QUANTITATIVE);
  }
};
