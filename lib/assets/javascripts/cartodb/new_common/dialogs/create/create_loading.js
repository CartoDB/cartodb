var cdb = require('cartodb.js');

/**
 *  Create loading view
 *
 *  It will show a big loading when a new map is gonna be created
 *
 */

module.exports = cdb.core.View.extend({

  className: 'IntermediateInfo',
  tagName: 'div',
  
  initialize: function() {
    // this.template = 
  },

  render: function() {
    // this.
    return this;
  }

});