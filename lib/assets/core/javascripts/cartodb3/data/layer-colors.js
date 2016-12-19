module.exports = {
  COLORS: [
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
