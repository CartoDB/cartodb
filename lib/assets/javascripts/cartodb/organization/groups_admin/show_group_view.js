var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupUsersView = require('./group_users_view');
var AddGroupUsersView = require('../../common/dialogs/add_group_users/add_group_users_view');
var ViewFactory = require('../../common/view_factory');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * View representing the default "show" defaults of a group.
 * Only lists the users added to the group already.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-add-users': '_onClickAddUsers',
    'click .js-rm-users': '_onClickRemoveUsers'
  },

  initialize: function() {
    _.each(['group', 'orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    // If there are no users show the add-group-users dialog right away
    if (this.options.group.users.length === 0) {
      this._openAddGroupsUsersDialog();
    }

    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('organization/groups_admin/show_group')({
      })
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
  },

  _initBinds: function() {
    this.options.group.users.on('change:selected', this._onChangeSelectedUser, this);
    this.options.group.users.on('add remove', this.render, this);
    this.add_related_model(this.options.group.users);
  },

  _onChangeSelectedUser: function() {
    var hasSelectedUsers = this._selectedUsers().length > 0;
    this.$('.js-default-header').toggle(!hasSelectedUsers);
    this.$('.js-selected-users-header').toggle(hasSelectedUsers);
  },

  _onClickRemoveUsers: function(ev) {
    this.killEvent(ev);
    var selectedUsers = this._selectedUsers();
    if (selectedUsers.length > 0) {
      var userIds = _.map(selectedUsers, function(m) { return m.id; });

      var loadingView = ViewFactory.createDialogByTemplate('common/templates/loading', {
        title: 'Removing users',
        quote: randomQuote()
      })
      loadingView.appendToBody();

      this.options.group.users.removeInBatch(userIds)
        .always(function() {
          loadingView.close();
        })
        .fail(function() {
          var errorView = ViewFactory.createDialogByTemplate('common/templates/fail', {
            msg: ''
          })
          errorView.appendToBody();
        });
    }
  },

  _selectedUsers: function() {
    return this.options.group.users.where({ selected: true });
  }

});
