var _ = require('underscore');
var colorScales = [
  '#7F3C8D',
  '#11A579',
  '#3969AC',
  '#F2B701',
  '#E73F74'
]; // Demo colors

function getColorRange (styles) {
  var colorRange = styles && styles.definition &&
      styles.definition.color &&
      styles.definition.color.range;

  return colorRange || colorScales;
}

/**
 *  Class to set categories to each color
 *  - Right now, there is a relation 1 color to 1 category.
 *  - If that category is not available in the new data, that
 *    color will be freed.
 *
 */

function CategoryColors (styles) {
  this.updateColors(styles);
}

CategoryColors.prototype.updateColors = function (styles) {
  var colorRange = getColorRange(styles);
  this.colors = {};
  _.each(colorRange, function (c) {
    this.colors[c] = null;
  }, this);
};

CategoryColors.prototype.updateData = function (d) {
  // Remove categories from colors where they are not present anymore
  _.each(this.colors, function (value, key) {
    if (!_.contains(d, value)) {
      this.colors[key] = null;
    } else {
      d = _.without(d, value);
    }
  }, this);

  // Set colors by new categories
  _.each(d, function (category) {
    var nextFreeColor = this.getNextAvailableColor();
    if (nextFreeColor) {
      this.colors[nextFreeColor] = category;
    }
  }, this);
};

CategoryColors.prototype.getNextAvailableColor = function () {
  for (var i in this.colors) {
    if (this.colors[i] === null) {
      return i;
    }
  }
  return null;
};

CategoryColors.prototype.getColorByCategory = function (category) {
  for (var i in this.colors) {
    if (this.colors[i] === category) {
      return i;
    }
  }
  return '#A5AA99';
};

CategoryColors.prototype.getCategoryByColor = function (color) {
  return this.colors[color];
};

module.exports = CategoryColors;
