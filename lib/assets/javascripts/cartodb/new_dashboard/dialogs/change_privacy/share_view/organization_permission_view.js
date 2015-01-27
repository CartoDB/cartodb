var PermissionView = require('./permission_view');

/**
 * View model for an organization permission item.
 */
module.exports = PermissionView.extend({

  _templateVars: function() {
    return {
      title: 'Default settings for your Organization',
      desc: 'New users will have this permission',
      canRead: false,
      canWrite: false
    };
  }
});
