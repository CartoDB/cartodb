var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Common logic for a URLs.
 */
module.exports = cdb.core.Model.extend({

  /**
   * Flatten arguments to a consistent URL.
   * It's assumed that all arguments are paths, or lists of paths (see example for expected input and what output gives).
   * @param [*] e.g. 'https://team.cartodb.com', ['u', 'tomás'], ['viz', 'abc-123-c', 'public_map']
   * @returns {string|*} e.g. 'https://team.cartodb.com/u/tomás/viz/abc-123-c/public_map'
   */
  toStr: function(/*string, array, ...*/) {
    return _.chain(arguments).flatten().compact().value().join('/');
  },

  /**
   * Convenient method to get the toUrld version for a mail URL.
   *
   * @param email {String} e.g. 'foo@bar.com'
   * @returns {string} 'mailto:foo@bar.com'
   * @protected
   */
  _mailto: function(email) {
    return 'mailto:'+ email;
  }
});
