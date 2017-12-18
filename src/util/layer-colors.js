var _ = require('underscore');

module.exports = {
  COLORS: [
    '#11A579',
    '#E83f74',
    '#9F5DC8',
    '#EF8205',
    '#29B3B2',
    '#E54F3B',
    '#59BB12',
    '#EF57BA',
    '#E2AF00',
    '#12AADE'
  ],

  /**
   * Get the letter representation.
   * @param {String, Object} sourceId or backbone model that have id. e.g. 'c2'
   * @return {String} e.g. 'c' or an empty string if there is no letter in the given id
   */
  letter: function (sourceId) {
    if (!sourceId || !_.isString(sourceId)) return '';
    var match = sourceId.match(/^([a-z]+)/);
    return (_.isArray(match) && match[0]) || '';
  },

  /**
   * Returns a color given a letter
   * @param  {String} Letter. eg: 'a', 'b', 'c', etc.
   * @return {String} Hex color code: eg: '#7F3C8D'
   */
  getColorForLetter: function (letter) {
    if (!letter) {
      return this.COLORS[0];
    }

    var letterNumber = letter.charCodeAt(0) - 97;
    var colorIndex = ((letterNumber / this.COLORS.length % 1) * 10).toFixed();
    return this.COLORS[colorIndex] || this.COLORS[0];
  }
};
