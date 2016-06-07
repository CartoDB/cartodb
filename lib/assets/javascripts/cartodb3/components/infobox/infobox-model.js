var cdb = require('cartodb.js');
var INFOBOX_DEFAULT_STATE = '';

/**
 * View model of a infobox
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    state: INFOBOX_DEFAULT_STATE
  }

});
