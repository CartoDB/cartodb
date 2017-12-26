var Backbone = require('backbone');
var INFOBOX_DEFAULT_STATE = '';

/**
 * View model of a infobox
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    state: INFOBOX_DEFAULT_STATE
  }

});
