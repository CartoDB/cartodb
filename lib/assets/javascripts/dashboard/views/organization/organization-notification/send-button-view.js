const $ = require('jquery');
const CoreView = require('backbone/core-view');
const Backbone = require('backbone');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./send-button.tpl');

const REQUIRED_OPTS = [
  'modals',
  'needsPasswordConfirmation'
];

const MAX_NOTIFICATION_LENGTH = 140;

module.exports = CoreView.extend({
  className: 'FormAccount-rowData',

  events: {
    'click .js-button': 'onUpdate'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      status: 'idle',
      counter: 0
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      isLoading: this._isLoading(),
      isDisabled: this._isDisabled(),
      isNegative: this._isNegative(),
      counter: MAX_NOTIFICATION_LENGTH - this.model.get('counter')
    }));

    return this;
  },

  updateCounter: function (strLen) {
    this.model.set('counter', strLen);
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _isNegative: function () {
    return this.model.get('counter') > MAX_NOTIFICATION_LENGTH;
  },

  _isDisabled: function () {
    return (this.model.get('counter') === 0) || this._isNegative() || this._isLoading();
  },

  _isLoading: function () {
    return this.model.get('status') === 'loading';
  },

  _submit: function () {
    this.trigger('submitForm');
  },

  onUpdate: function (event) {
    this.killEvent(event);

    const form = $('#new_carto_notification');

    if (this._isDisabled()) return false;

    if (!this._needsPasswordConfirmation) {
      this.model.set({ status: 'loading' });
      return this._submit();
    }

    PasswordValidatedForm.showPasswordModal({
      modalService: this._modals,
      onPasswordTyped: password => {
        PasswordValidatedForm.addPasswordToForm(form, password, {
          doNotSubmit: true
        });

        this.model.set({ status: 'loading' });
        this._submit();
      }
    });
  }
});
