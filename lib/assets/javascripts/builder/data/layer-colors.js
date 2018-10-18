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
