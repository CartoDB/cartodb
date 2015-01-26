var cdb = require('cartodb.js');

/**
 * View model for a permission item.
 * Represents a cdb.admin.User model by default.
 */
module.exports = cdb.core.Model.extend({

  title: function() {
  },
  
  desc: function() {
  },
  
  canWrite: function() {
    return false;
  },
  
  canRead: function() {
    return false;
  },
  
  toggleRead: function() {
  },
  
  toggleWrite: function() {
  }
});
