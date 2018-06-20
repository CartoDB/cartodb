const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const PagedSearchView = require('dashboard/components/paged-search/paged-search-view');
const PagedSearchModel = require('dashboard/data/paged-search-model');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const template = require('./add-group-users-view.tpl');
const loadingView = require('builder/components/loading/render-loading.js');
const requestErrorTemplate = require('dashboard/views/data-library/content/request-error-template.tpl');
const responseParser = require('dashboard/helpers/response-parser');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const GroupUsersListView = require('dashboard/views/organization/groups-admin/group-users-list/group-users-list-view');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'orgUsers',
  'userModel',
  'modalModel'
];

/**
 * Dialog to add custom basemap to current map.
 */
module.exports = CoreView.extend({
  events: {
    'click .ok': 'ok'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.model = new Backbone.Model();

    // Include current user in fetch results
    this._orgUsers.excludeCurrentUser(false);

    this._modals = new ModalsServiceModel();

    this._initBinds();
    this._initViews();
  },

  clean: function () {
    // restore org users
    this._orgUsers.restoreExcludeCurrentUser();
    CoreView.prototype.clean.apply(this);
  },

  /**
   * @override cdb.ui.common.Dialog.prototype.render
   */
  render: function () {
    this.$el.html(this.render_content());
    this.$el.addClass('Dialog-contentWrapper');
    this._onChangeSelected();
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function () {
    switch (this.model.get('state')) {
      case 'saving':
        return loadingView({
          title: 'Adding users to group'
        });
      case 'passwordConfirmationFail':
        return requestErrorTemplate({
          msg: this.model.get('failMessage')
        });
      case 'saveFail':
        return errorTemplate({
          msg: ''
        });
      default:
        const $content = $(template());
        $content.find('.js-dlg-body').replaceWith(this._PagedSearchView.render().el);
        return $content;
    }
  },

  ok: function () {
    const selectedUsers = this._selectedUsers();

    if (!selectedUsers.length) return;

    if (!this._userModel.needsPasswordConfirmation()) {
      this.model.set('state', 'saving');
      return this._addUsers();
    }

    PasswordValidatedForm.showPasswordModal({
      modalService: this._modals,
      onPasswordTyped: password => {
        this.model.set('state', 'saving');
        this._addUsers(password);
      }
    });
  },

  _initViews: function () {
    this._PagedSearchView = new PagedSearchView({
      isUsedInDialog: true,
      pagedSearchModel: new PagedSearchModel({
        per_page: 50,
        order: 'username'
      }),
      collection: this._orgUsers,
      createListView: this._createUsersListView.bind(this)
    });

    this.addView(this._PagedSearchView);
  },

  _createUsersListView: function () {
    return new GroupUsersListView({
      users: this._orgUsers
    });
  },

  _initBinds: function () {
    this.listenTo(this._orgUsers, 'change:selected', this._onChangeSelected);
    this.listenTo(this.model, 'change:state', this.render);
  },

  _onChangeSelected: function () {
    this.$('.ok').toggleClass('is-disabled', this._selectedUsers().length === 0);
  },

  _selectedUsers: function () {
    return this._orgUsers.where({ selected: true });
  },

  _addUsers: function (password) {
    const selectedUsers = this._selectedUsers();
    const ids = _.pluck(selectedUsers, 'id');

    this._group.users.addInBatch(ids, password)
      .done(() => {
        this._group.users.add(selectedUsers);
        this._modalModel.destroy();
      })
      .fail(response => {
        const errors = responseParser(response) || '';

        if (errors.indexOf('Confirmation password') > -1) {
          return this.model.set({
            state: 'passwordConfirmationFail',
            failMessage: errors || ''
          });
        }

        this.model.set({ state: 'saveFail' });
      });
  }
});
