var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupUsersView = require('./group_users_view');
var AddGroupUsersView = require('../../common/dialogs/add_group_users/add_group_users_view');

/**
 * View representing the default "show" defaults of a group.
 * Only lists the users added to the group already.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-add-users': '_onClickAddUsers'
  },

  initialize: function() {
    _.each(['group', 'orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    // If there are no users show the add-group-users dialog right away
    if (this.options.group.users.length === 0) {
      this._openAddGroupsUsersDialog();
    }
  },

  render: function() {
    this.$el.html(
      this.make('button', { class: 'Button Button--link js-add-users' }, 'Add new users')
    );
    this._renderUsers();
    return this;
  },

  _renderUsers: function() {
    var usersView = new GroupUsersView({
      users: this.options.group.users
    })
    this.addView(usersView);
    this.$el.append(usersView.render().el);
  },

  _onClickAddUsers: function(ev) {
    this.killEvent(ev);
    this._openAddGroupsUsersDialog();
  },

  _openAddGroupsUsersDialog: function() {
    var addGroupUsersView = new AddGroupUsersView({
      group: this.options.group,
      orgUsers: this.options.orgUsers
    })
    addGroupUsersView.appendToBody();
  }

});
