const _ = require('underscore');
const CoreView = require('backbone/core-view');
const ViewFactory = require('builder/components/view-factory');
const template = require('./empty-group-filters-extra.tpl');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const loadingView = require('builder/components/loading/render-loading.js');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const randomQuote = require('builder/components/loading/random-quote');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'groupUsers',
  'orgUsers',
  'userModel'
];

/**
 * View for the add users button and state.
 */
module.exports = CoreView.extend({
  className: 'Filters-group',

  events: {
    'click .js-add-users': '_onClickAddUsers'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._modals = new ModalsServiceModel();

    // Init binds
    this.listenTo(this._orgUsers, 'change:selected', this._onChangeSelectedUser);
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _onChangeSelectedUser: function () {
    this.$('.js-add-users').toggleClass('is-disabled', this._selectedUsers().length === 0);
  },

  _onClickAddUsers: function (ev) {
    this.killEvent(ev);

    if (!this._userModel.needsPasswordConfirmation()) {
      return this._addUsers();
    }

    PasswordValidatedForm.showPasswordModal({
      modalService: this._modals,
      onPasswordTyped: password => this._addUsers(password)
    });
  },

  _addUsers: function (password) {
    const selectedUsers = this._selectedUsers();

    if (selectedUsers.length > 0) {
      const userIds = _.pluck(selectedUsers, 'id');

      const modalModel = this._modals.create(modalModel => {
        return this._createLoadingView();
      });

      this._groupUsers.addInBatch(userIds, password)
        .always(() => modalModel.destroy())
        .fail(response => {
          const responseJSON = response && response.responseJSON;
          let errors = responseJSON && responseJSON.message;

          if (responseJSON && responseJSON.errors && responseJSON.errors.length) {
            errors = responseJSON.errors.join('. ') + '. ';
          }

          this._modals.create(function (modalModel) {
            return ViewFactory.createByHTML(errorTemplate({ msg: errors }));
          });
        });
    }
  },

  _createLoadingView: function () {
    return ViewFactory.createByHTML(loadingView({
      title: 'Adding users',
      descHTML: randomQuote()
    }));
  },

  _selectedUsers: function () {
    return this._orgUsers.where({ selected: true });
  }

});
