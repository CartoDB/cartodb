var _ = require('underscore');
var cdb = require('cartodb.js');
var pluralizeString = require('../../../view_helpers/pluralize_string')

module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['permission'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    var usersCount = this.model.users.length;
    this.$el.html(
      this.getTemplate('common/dialogs/change_privacy/share/user_details')({
        willRevokeAccess: false,
        avatarUrl: this.model.get('avatar_url'),
        title: this.model.get('display_name'),
        desc: pluralizeString('1 member', usersCount + ' members', usersCount)
      })
    );
    return this;
  }
});
