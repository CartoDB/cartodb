var cdb = require('cartodb.js');
var INFOBOX_DEFAULT_STATE = 'idle';

/**
 * View model of a infobox
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    state: INFOBOX_DEFAULT_STATE
  },

  initialize: function (opts) {
    if (!opts.state) throw new Error('State is mandatory');
  }

});
