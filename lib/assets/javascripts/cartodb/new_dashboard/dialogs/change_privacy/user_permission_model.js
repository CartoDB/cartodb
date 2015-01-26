var PermissionModel = require('./permission_model');

/**
 * View model for a permission item.
 * Represents a cdb.admin.User model by default.
 */
module.exports = PermissionModel.extend({

  title: function() {
    return this.get('user').get('username');
  },
  
  desc: function() {
    return this.get('user').get('name');
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
