var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

/**
 * View for the user details to show in the context of a permission item.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['permission', 'isUsingVis'], function(name) {
      if (_.isUndefined(this.options[name])) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/change_privacy/share/details')({
        willRevokeAccess: this._willRevokeAccess(),
        avatarUrl: this.model.get('avatar_url'),
        title: this.model.get('username'),
        desc: this._desc(),
        roleLabel: this.model.get('viewer') ? 'Viewer' : 'Builder'
      })
    );
    return this;
  },

  _desc: function() {
    var email = this.model.get('email')

    if (this._willRevokeAccess()) {
      return email + ". User's maps will be affected";
    } else if (this.options.isUsingVis) {
      return email + ". User is using this dataset";
    } else {
      return email;
    }
  },

  _willRevokeAccess: function() {
    return this.options.isUsingVis && !this.options.permission.hasReadAccess(this.model);
  }
});
