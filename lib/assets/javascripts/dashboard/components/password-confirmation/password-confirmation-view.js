const _ = require('underscore');
const CoreView = require('backbone/core-view');
const template = require('./password-confirmation.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel',
  'onPasswordTyped'
];

/**
 * Password Confirmation Modal
 *
 * Modal used for password validated forms, so
 * the user needs to type the password in to
 * save form changes
 */

module.exports = CoreView.extend({
  events: {
    'click .js-ok': '_onConfirm',
    'click .js-cancel': '_closeDialog',
    'keydown #password-confirmation-form': '_onEnterPressed',
    'input .js-password': '_toggleConfirmButton'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._isConfirmDisabled = true;
  },

  render: function () {
    this.$el.html(
      template({
        isConfirmDisabled: this._isConfirmDisabled
      })
    );

    this._okButton = this.$('.js-ok');
    return this;
  },

  _toggleConfirmButton: function (event) {
    const passwordInput = event.target;
    this._isConfirmDisabled = _.isEmpty(passwordInput.value);
    this._okButton.toggleClass('is-disabled', this._isConfirmDisabled);
  },

  _onConfirm: function (event) {
    this.killEvent(event);

    if (this._isConfirmDisabled) {
      return;
    }

    const passwordValue = this.$('#password-confirmation').val();
    this._onPasswordTyped && this._onPasswordTyped(passwordValue);
    this._closeDialog();
  },

  _onEnterPressed: function (event) {
    if (event.keyCode !== 13) {
      return;
    }

    this._onConfirm(event);
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
