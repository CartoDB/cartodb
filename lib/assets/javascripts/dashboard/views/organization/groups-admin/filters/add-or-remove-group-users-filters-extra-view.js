const _ = require('underscore');
const CoreView = require('backbone/core-view');
const AddGroupUsersView = require('dashboard/views/organization/groups-admin/add-group-users/add-group-users-view');
const template = require('./add-or-remove-group-users-filters-extra.tpl');
const ViewFactory = require('builder/components/view-factory');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const randomQuote = require('builder/components/loading/random-quote');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'orgUsers'
];

/**
 * View for the add/remove button in the filters part.
 */
module.exports = CoreView.extend({
  className: 'Filters-group',

  events: {
    'click .js-add-users': '_onClickAddUsers',
    'click .js-rm-users': '_onClickRemoveUsers'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._modals = new ModalsServiceModel();

    this.listenTo(this._group.users, 'change:selected', this._onChangeSelectedUser);
    this.listenTo(this._group.users, 'add remove reset', this.render);
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _onClickAddUsers: function (event) {
    this.killEvent(event);
    this._openAddGroupsUsersDialog();
  },

  _openAddGroupsUsersDialog: function () {
    this._modals.create(modalModel => {
      return new AddGroupUsersView({
        group: this._group,
        orgUsers: this._orgUsers,
        modalModel
      });
    })
  },

  _onChangeSelectedUser: function () {
    const hasSelectedUsers = this._selectedUsers().length > 0;
    this.$('.js-add-users').toggle(!hasSelectedUsers);
    this.$('.js-rm-users').toggle(hasSelectedUsers);
  },

  _onClickRemoveUsers: function (ev) {
    this.killEvent(ev);

    const selectedUsers = this._selectedUsers();

    if (selectedUsers.length > 0) {
      const userIds = _.pluck(selectedUsers, 'id');

      // TODO: AÑADIR MODALS
      const loadingView = ViewFactory.createDialogByTemplate(loadingTemplate, {
        title: 'Removing users',
        quote: randomQuote()
      });
      loadingView.appendToBody();

      this.options.group.users.removeInBatch(userIds)
        .always(function () {
          loadingView.close();
        })
        .fail(function () {
          // Igual hay que usar modals aqui
          const errorView = ViewFactory.createDialogByTemplate(errorTemplate, {
            msg: ''
          });
          errorView.appendToBody();
        });
    }
  },

  _selectedUsers: function () {
    return this._group.users.where({ selected: true });
  }
});
