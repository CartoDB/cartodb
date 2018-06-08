const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const loadingView = require('builder/components/loading/render-loading');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const template = require('./edit-group.tpl');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'userModel',
  'flashMessageModel',
  'modals',
  'onSaved',
  'onDeleted'
];

/**
 * View to edit an organization group.
 */
module.exports = CoreView.extend({
  tagName: 'form',

  events: {
    'click .js-delete': '_onClickDelete',
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.model = new Backbone.Model();
    this._initBinds();
  },

  render: function () {
    if (this.model.get('isLoading')) {
      this.$el.html(
        loadingView({
          title: this.model.get('loadingText')
        })
      );
    } else {
      this.$el.html(
        template({ displayName: this._group.get('display_name') })
      );
    }
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:isLoading', this.render);
  },

  _onClickSave: function (ev) {
    this.killEvent(ev);

    const name = this._name();

    if (name && name !== this._group.get('display_name')) {
      this._setLoading('Saving changes');
      this._group.save(
        { display_name: name },
        {
          wait: true,
          success: this._onSaved,
          error: this._showErrors.bind(this)
        });
    }
  },

  _onClickDelete: function (ev) {
    this.killEvent(ev);

    if (!this._userModel.needsPasswordConfirmation()) {
      return this._destroyGroup();
    }

    PasswordValidatedForm.showPasswordModal({
      modalService: this._modals,
      onPasswordTyped: password => this._destroyGroup(password)
    });
  },

  _destroyGroup: function (password) {
    this._setLoading('Deleting group');

    this._group.destroy({
      wait: true,
      data: JSON.stringify({
        ...this._group.attributes,
        password_confirmation: password
      }),
      contentType: 'application/json; charset=utf-8',
      success: this._onDeleted,
      error: this._showErrors.bind(this)
    });
  },

  _setLoading: function (msg) {
    this._flashMessageModel.hide();

    this.model.set({
      isLoading: !!msg,
      loadingText: msg
    });
  },

  _showErrors: function (message, response, request) {
    this._setLoading('');

    let flashMessage = 'Could not update group for some unknown reason, please try again';
    let jsonData;

    try {
      jsonData = response && JSON.parse(response.responseText);
    } catch (e) {
      jsonData = {};
    }

    if (jsonData && jsonData.errors) {
      flashMessage = jsonData.errors.join('. ');
    }

    this._flashMessageModel.show(flashMessage, 'error');
  },

  _onChangeName: function () {
    this.$('.js-save').toggleClass('is-disabled', this._name().length === 0);
    this._flashMessageModel.hide();
  },

  _name: function () {
    return this.$('.js-name').val();
  }

});
