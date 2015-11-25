var _ = require('underscore');
var colorbrewer = require('colorbrewer');
var categoryColors = _.initial(colorbrewer.Accent[8]);
var defaultColor = '#CCC';

function CategoryColors() {
  this.colors = {};
  _.each(categoryColors, function(c) {
    this.colors[c] = null;
  }, this);
}

CategoryColors.prototype.updateData = function(d) {
  // Remove categories from colors where they are not present anymore
  _.each(this.colors, function(value, key) {
    if (!_.contains(d, value)) {
      this.colors[key] = null;
    } else {
      d = _.without(d, value);
    }
  }, this);

  // Set colors by new categories
  _.each(d, function(category) {
    var nextFreeColor = this.getNextAvailableColor();
    if (nextFreeColor) {
      this.colors[nextFreeColor] = category;
    }
  }, this);
};

CategoryColors.prototype.getNextAvailableColor = function() {
  for (var i in this.colors) {
    if (this.colors[i] === null) {
      return i;
    }
  }
};

CategoryColors.prototype.getAllCategoryColors = function () {
  return _.map(this.colors, function(key, value) {
    return [value, key];
  });
};

CategoryColors.prototype.getColorByCategory = function (category) {
  for (var i in this.colors) {
    if (this.colors[i] === category) {
      return i;
    }
  }
  return defaultColor;
};

CategoryColors.prototype.getCategoryByColor = function (color) {
  return this.colors[color];
};

module.exports = CategoryColors;
