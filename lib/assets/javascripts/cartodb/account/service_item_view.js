var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');

/**
 *  Service item view
 *
 *  Connect or disconnect from a service
 *
 */


module.exports = cdb.core.View.extend({

  events: {
    'click .js-connect': '_connect',
    'click .js-disconnect': '_disconnect'
  },

  initialize: function() {
    
  },

  _connect: function() {

  },

  _disconnect: function() {
    
  }

});
