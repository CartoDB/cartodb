var _ = require('underscore');

module.exports = {

  /**
   * Get the next available letter.
   * @param {Array} letters e.g. ['a', 'b', 'd']
   * @return {String} e.g. 'c'
   */
  next: function (letters) {
    return _.chain(letters)
      .sort()
      .reduce(function (memo, letter) {
        if (letter === memo) {
          return String.fromCharCode(letter.charCodeAt() + 1);
        } else {
          return memo;
        }
      }, 'a')
      .value();
  }

};
