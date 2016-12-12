
var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

/**
 *  User notification default model
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    type:     '',
    message:  '',
    opened:   false
  }

});