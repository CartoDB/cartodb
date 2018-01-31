var _ = require('underscore');

function rotateCollection (array) {
  var first = _.first(array);
  array = _.rest(array);
  return array.concat([first]);
}

var COLORS = [
  '#66B79E',
  '#E65176',
  '#528995',
  '#FF710F',
  '#305482',
  '#CCD859',
  '#565175',
  '#FFB927',
  '#3EBCAE',
  '#E54C1F'
];

module.exports = {
  getNextColor: function () {
    COLORS = rotateCollection(COLORS);
    return _.first(COLORS);
  },

  getColors: function () {
    return COLORS;
  },

  setColors: function (collection) {
    COLORS = collection;
  }
};
