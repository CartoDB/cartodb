const CoreView = require('backbone/core-view');
const template = require('./delete-account.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel',
  'userModel',
  'onError',
  'client'
];

/**
 *  When user wants to delete his own account
 */

module.exports = CoreView.extend({
  events: {
    'click .js-ok': '_onClickDelete',
    'click .js-cancel': '_closeDialog',
    'submit .js-form': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    CoreView.prototype.initialize.apply(this);

    this._isLoading = false;
  },

  render: function () {
    this.$el.html(
      template({
        passwordNeeded: !!this._userModel.get('needs_password_confirmation'),
        isLoading: this._isLoading
      })
    );

    return this;
  },

  _onClickDelete: function (event) {
    this.killEvent(event);

    const params = {
      deletion_password_confirmation: this.$('#deletion_password_confirmation').val()
    };

    this._isLoading = true;

    this.render();

    this._client.deleteUser(params, (errors, response, data) => {
      this._isLoading = false;
      this.render();

      if (errors) {
        this._onFormError(data, errors);
      } else {
        this._onSuccess(data);
      }
    });
  },

  _setHref: function (href) {
    window.location.href = href;
  },

  _onSuccess: function (data) {
    this._setHref(data.logout_url);
    this._closeDialog();
  },

  _onFormError: function (data, errors) {
    this._onError(data, errors);
    this._closeDialog();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
