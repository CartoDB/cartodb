var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ViewFactory = require('../../common/view_factory');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * View for the add users button and state.
 */
module.exports = cdb.core.View.extend({

  className: 'Filters-group',

  events: {
    'click .js-add-users': '_onClickAddUsers'
  },

  initialize: function () {
    _.each(['groupUsers', 'orgUsers'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    // Init binds
    this.options.orgUsers.on('change:selected', this._onChangeSelectedUser, this);
    this.add_related_model(this.options.orgUsers);
  },

  render: function () {
    this.$el.html(
      this.getTemplate('organization/groups_admin/empty_group_filters_extra')({
      })
    );
    return this;
  },

  _onChangeSelectedUser: function () {
    this.$('.js-add-users').toggleClass('is-disabled', this._selectedUsers().length === 0);
  },

  _onClickAddUsers: function (ev) {
    this.killEvent(ev);
    var selectedUsers = this._selectedUsers();
    if (selectedUsers.length > 0) {
      var userIds = _.pluck(selectedUsers, 'id');
      var loadingView = this._createLoadingView();
      loadingView.appendToBody();

      this.options.groupUsers.addInBatch(userIds)
        .always(function () { loadingView.close(); })
        .fail(function () {
          ViewFactory.createDialogByTemplate('common/templates/fail', { msg: '' }).appendToBody();
        });
    }
  },

  _createLoadingView: function () {
    return ViewFactory.createDialogByTemplate('common/templates/loading', {
      title: 'Adding users',
      quote: randomQuote()
    });
  },

  _selectedUsers: function () {
    return this.options.orgUsers.where({ selected: true });
  }

});
