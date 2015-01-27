var PermissionView = require('./permission_view');

/**
 * View model for an organization permission item.
 */
module.exports = PermissionView.extend({

  _templateVars: function() {
    return {
      title: this.model.get('username'),
      desc: this.model.get('name'),
      avatarUrl: this.model.get('avatar_url'),
      canRead: false,
      canWrite: false
    };
  }
});
