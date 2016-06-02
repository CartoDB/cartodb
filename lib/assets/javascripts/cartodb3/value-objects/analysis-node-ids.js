var SOURCE_ID_REGEX = /^([a-z]+)(\d*)$/; // matches a string with one or more letters + numbers, e.g. 'b2'

/**
 * Encapsulates logic related to the nodes' IDs.
 */
module.exports = {

  /**
   * Get next sourceId in sequence of given source sourceId.
   * @param {String} sourceId, e.g. 'c2'
   * @return {String} e.g. 'c3'
   */
  next: function (sourceId) {
    if (!sourceId || !sourceId.match) throw new Error('invalid sourceId');

    var matches = sourceId.match(SOURCE_ID_REGEX);
    matches[2] = matches[2] || -1;

    if (matches && matches.length === 3) {
      // letter + next number
      var letter = matches[1];
      var nextNumber = parseInt(matches[2], 10) + 1;
      return letter + nextNumber;
    } else {
      throw new Error('invalid sourceId');
    }
  },

  /**
   * Get the letter representation.
   * @param {String, Object} sourceId or backbone model that have id. e.g. 'c2'
   * @return {String} e.g. 'c'
   */
  letter: function (sourceId) {
    return sourceId.match(/^([a-z]+)/)[0];
  }

};
