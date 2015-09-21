var _ = require('underscore');
var cdb = require('cartodb.js');
var pluralizeString = require('../../../view_helpers/pluralize_string')

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
        title: this.model.get('display_name'),
        desc: this._desc()
      })
    );
    return this;
  },

  _desc: function() {
    var usersCount = this.model.users.length;
    var xMembers = pluralizeString('1 member', usersCount + ' members', usersCount);

    if (this._willRevokeAccess()) {
      return xMembers + pluralizeString("'s", "'", usersCount) + ' maps will be affected';
    } else if (this.options.isUsingVis) {
      return xMembers + ' ' + pluralizeString('is', 'are', usersCount) + ' using this dataset';
    } else {
      return xMembers;
    }
  },

  _willRevokeAccess: function() {
    return this.options.isUsingVis && !this.options.permission.hasReadAccess(this.model);
  }

});
