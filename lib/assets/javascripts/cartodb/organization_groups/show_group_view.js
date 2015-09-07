var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupUsersView = require('./group_users_view');

/**
 * View representing the default "show" defaults of a group.
 * Only lists the users added to the group already.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['group'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.make('button', { class: 'Button Button--link' }, 'Add new users')
    );
    this._renderUsers();
    return this;
  },

  _initBinds: function() {
  },

  _renderUsers: function() {
    var usersView = new GroupUsersView({
      el: $('<ul>').addClass('OrganizationList'),
      users: this.options.group.users
    })
    this.addView(usersView);
    this.$el.append(usersView.render().el);
  }
});
