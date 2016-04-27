var _ = require('underscore');
var colorScales = [['#2CA095', '#E5811B', '#4A4DBA', '#AD2BAD', '#559030', '#E1C221'],
                   ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)'],
                   ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)', 'rgb(102,166,30)', 'rgb(230,171,2)'],
                   ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(240,2,127)'],
                   ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)']
                  ]; // Demo colors

/**
 *  Class to set categories to each color
 *  - Right now, there is a relation 1 color to 1 category.
 *  - If that category is not available in the new data, that
 *    color will be freed.
 *
 */

function CategoryColors () {
  this.colors = {};
  _.each(colorScales[0], function (c) {
    this.colors[c] = null;
  }, this);
}

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
  return Object.keys(this.colors)[Object.keys(this.colors).length - 1];
};

CategoryColors.prototype.getCategoryByColor = function (color) {
  return this.colors[color];
};

module.exports = CategoryColors;
