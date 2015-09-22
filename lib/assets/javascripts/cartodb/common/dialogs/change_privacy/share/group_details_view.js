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
    var xMembers = pluralizeString.prefixWithCount('member', 'members', this.model.users.length);

    if (this._willRevokeAccess()) {
      return xMembers + '. At least one member map will be affected';
    } else if (this.options.isUsingVis) {
      return xMembers + '. At least one member is using this dataset';
    } else {
      return xMembers;
    }
  },

  _willRevokeAccess: function() {
    return this.options.isUsingVis && !this.options.permission.hasReadAccess(this.model);
  }

});
