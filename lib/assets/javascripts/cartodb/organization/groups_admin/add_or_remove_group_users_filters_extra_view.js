var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var AddGroupUsersView = require('../../common/dialogs/add_group_users/add_group_users_view');
var ViewFactory = require('../../common/view_factory');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * View for the add/remove button in the filters part.
 */
module.exports = cdb.core.View.extend({

  className: 'Filters-group',

  events: {
    'click .js-add-users': '_onClickAddUsers',
    'click .js-rm-users': '_onClickRemoveUsers'
  },

  initialize: function () {
    _.each(['group', 'orgUsers'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.options.group.users.on('change:selected', this._onChangeSelectedUser, this);
    this.options.group.users.on('add remove reset', this.render, this);
    this.add_related_model(this.options.group.users);
  },

  render: function () {
    this.$el.html(
      this.getTemplate('organization/groups_admin/add_or_remove_group_users_filters_extra')({
      })
    );
    return this;
  },

  _onClickAddUsers: function (ev) {
    this.killEvent(ev);
    this._openAddGroupsUsersDialog();
  },

  _openAddGroupsUsersDialog: function () {
    var addGroupUsersView = new AddGroupUsersView({
      group: this.options.group,
      orgUsers: this.options.orgUsers
    });
    addGroupUsersView.appendToBody();
  },

  _onChangeSelectedUser: function () {
    var hasSelectedUsers = this._selectedUsers().length > 0;
    this.$('.js-add-users').toggle(!hasSelectedUsers);
    this.$('.js-rm-users').toggle(hasSelectedUsers);
  },

  _onClickRemoveUsers: function (ev) {
    this.killEvent(ev);
    var selectedUsers = this._selectedUsers();
    if (selectedUsers.length > 0) {
      var userIds = _.pluck(selectedUsers, 'id');

      var loadingView = ViewFactory.createDialogByTemplate('common/templates/loading', {
        title: 'Removing users',
        quote: randomQuote()
      });
      loadingView.appendToBody();

      this.options.group.users.removeInBatch(userIds)
        .always(function () {
          loadingView.close();
        })
        .fail(function () {
          var errorView = ViewFactory.createDialogByTemplate('common/templates/fail', {
            msg: ''
          });
          errorView.appendToBody();
        });
    }
  },

  _selectedUsers: function () {
    return this.options.group.users.where({ selected: true });
  }

});
