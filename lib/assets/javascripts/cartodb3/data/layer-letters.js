var _ = require('underscore');

var LayerLetters = function () {
  this.letters = [];
};

/**
 * Generate a new letter and returns it
 * @return {String} e.g. 'c'
 */
LayerLetters.prototype.next = function () {
  // TODO bug in Backbone; this.chain().pluck('letter') returns [undefined, undefined, ...]
  var letter = _.chain(this.letters)
    .sort()
    .reduce(this.getNextAvailable, 'a')
    .value();

  this.letters.push(letter);

  return letter;
};

/**
 * @private
 */
LayerLetters.prototype.getNextAvailable = function (memo, letter) {
  if (letter === memo) {
    return String.fromCharCode(letter.charCodeAt() + 1);
  } else {
    return memo;
  }
};

/**
 * @param {String} letter
 */
LayerLetters.prototype.remove = function (letter) {
  this.letters = _.without(this.letters, letter);
};

module.exports = LayerLetters;
