var PermissionModel = require('./permission_model');

/**
 * View model for an organization permission item.
 */
module.exports = PermissionModel.extend({

  title: function() {
    return 'Default settings for your Organization';
  },
  
  desc: function() {
    return 'New users will have this permission';
  }
});
