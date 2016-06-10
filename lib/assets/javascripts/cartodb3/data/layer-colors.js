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
