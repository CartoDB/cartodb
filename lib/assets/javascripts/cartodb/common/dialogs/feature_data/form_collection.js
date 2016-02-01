var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');

/**
 *  Collection with all fields model
 *  included.
 *
 */

module.exports = Backbone.Collection.extend({

  isValid: function() {
    return !this.getInvalid();
  },

  getInvalid: function() {
    return this.find(function(mdl) {
      return !mdl.isValid()
    });
  }

})