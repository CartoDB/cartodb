var _ = require('underscore');

var SOURCE_ID_REGEX = /^([a-z]+)(\d*)$/; // matches a string with one or more letters + numbers, e.g. 'b2'

var newId = function (id, seqChange) {
  if (!id || !id.match) throw new Error('invalid id');

  var matches = id.match(SOURCE_ID_REGEX);
  matches[2] = matches[2] || -1;

  if (matches && matches.length === 3) {
    // letter + next number
    var letter = matches[1];
    var seq = parseInt(matches[2], 10) + seqChange;
    return letter + Math.max(seq, 0);
  } else {
    throw new Error('invalid id');
  }
};

/**
 * Encapsulates logic related to the nodes' IDs.
 */
module.exports = {

  /**
   * Get next id in sequence of given source id.
   * @param {String} id, e.g. 'c2'
   * @return {String} e.g. 'c3'
   */
  next: function (id) {
    return newId(id, 1);
  },

  prev: function (id) {
    return newId(id, -1);
  },

  /**
   * Get the letter representation.
   * @param {String, Object} sourceId or backbone model that have id. e.g. 'c2'
   * @return {String} e.g. 'c' or an empty string if there is no letter in the given id
   */
  letter: function (sourceId) {
    if (!sourceId || !_.isString(sourceId)) return '';
    var match = sourceId.match(/^([a-z]+)/);
    return _.isArray(match) && match[0] || '';
  },

  /**
   * Get the sequence representation.
   * @param {String, Object} sourceId or backbone model that have id. e.g. 'c2'
   * @return {Number} e.g. 2 or undefined if there is no sequence
   */
  sequence: function (sourceId) {
    if (!sourceId || !_.isString(sourceId)) return;
    var match = sourceId.match(/(\d+$)/);
    return _.isArray(match) && match[0] || undefined;
  },

  changeLetter: function (id, newLetter) {
    var seq = id.match(/(\d+)$/)[0];
    return newLetter + seq;
  }

};
