const _ = require('underscore');
const CoreView = require('backbone/core-view');
const AddGroupUsersView = require('dashboard/views/organization/groups-admin/add-group-users/add-group-users-view');
const template = require('./add-or-remove-group-users-filters-extra.tpl');
const ViewFactory = require('builder/components/view-factory');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const loadingView = require('builder/components/loading/render-loading.js');
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
    });
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

      const modalModel = this._modals.create(() => {
        return this._createLoadingView();
      });

      this._group.users.removeInBatch(userIds)
        .always(function () {
          modalModel.destroy();
        })
        .fail(() => {
          modalModel.destroy();

          this._modals.create(() =>
            ViewFactory.createByHTML(errorTemplate({
              msg: ''
            }))
          );
        });
    }
  },

  _createLoadingView: function () {
    return ViewFactory.createByHTML(loadingView({
      title: 'Removing users',
      descHTML: randomQuote()
    }));
  },

  _selectedUsers: function () {
    return this._group.users.where({ selected: true });
  }
});
