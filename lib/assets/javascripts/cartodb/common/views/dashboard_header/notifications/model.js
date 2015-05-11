
var cdb = require('cartodb.js');
var $ = require('jquery');

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