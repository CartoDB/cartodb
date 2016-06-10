var _ = require('underscore');

module.exports = {
  COLORS: [
    '#7F3C8D',
    '#11A579',
    '#3969AC',
    '#E73F74',
    '#80BA5A',
    '#E68310',
    '#008695',
    '#CF1C90',
    '#f97b72',
    '#A5AA99'
  ],

  next: function (usedColors) {
    usedColors = usedColors || [];
    var nextColor = _.find(this.COLORS, function (color) {
      return !_.contains(usedColors, color);
    });

    if (!nextColor) {
      nextColor = this.next(usedColors.splice(0, this.COLORS.length - 1));
    }

    return nextColor;
  }
};
