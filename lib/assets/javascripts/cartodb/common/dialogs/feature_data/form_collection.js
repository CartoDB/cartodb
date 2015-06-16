var cdb = require('cartodb.js');
var Backbone = require('backbone');

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