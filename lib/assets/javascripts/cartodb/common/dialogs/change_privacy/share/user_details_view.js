var _ = require('underscore');
var cdb = require('cartodb.js');

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
      this.getTemplate('common/dialogs/change_privacy/share/user_details')({
        willRevokeAccess: this._willRevokeAccess(),
        avatarUrl: this.model.get('avatar_url'),
        title: this.model.get('username'),
        desc: this._desc()
      })
    );
    return this;
  },

  _desc: function() {
    var consequencesStr;
    if (this._willRevokeAccess()) {
      consequencesStr = "'s maps will be affected";
    } else if (this.options.isUsingVis) {
      consequencesStr = ' is using this dataset';
    }

    var desc = this.model.get('email')
    if (consequencesStr) {
      var nameOrThisUser = this.model.get('name') || 'this user';
      desc += '.' + nameOrThisUser + consequencesStr;
    }

    return desc;
  },

  _willRevokeAccess: function() {
    return this.options.isUsingVis && !this.options.permission.hasReadAccess(this.model);
  }
});
