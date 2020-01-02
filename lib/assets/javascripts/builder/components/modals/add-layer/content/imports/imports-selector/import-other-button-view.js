var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./import-other-button.tpl');
var HubspotRequest = require('../hubspot-request');

var REQUIRED_OPTS = [
  'userModel'
];

/**
 * Import button to request connector
 */

module.exports = CoreView.extend({
  className: 'ImportOther',
  tagName: 'button',

  events: {
    'click .js-request': '_onRequest',
    'keyup .js-input': '_onKeyup',
    'click .js-submit': '_onSubmit',
    'click .js-ok': '_onOk'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._hasError = false;
  },

  render: function () {
    this.$el.html(template({
      hasError: this._hasError
    }));
    return this;
  },

  _onRequest: function () {
    this._goToStep(2);
  },

  _onKeyup: function () {
    var hasValue = this.$('.js-input').val();

    (hasValue ? this._enableSubmit() : this._disableSubmit());
  },

  _onOk: function () {
    this._goToStep(1);
  },

  _goToStep (step) {
    this.$('.js-step').removeClass('is-active');
    this.$(`.js-step${step}`).addClass('is-active');
  },

  _onSubmit: function () {
    this._goToStep(3);

    var inputValue = this.$('.js-input').val();
    var self = this;

    var data = HubspotRequest.getFormData(this._userModel, inputValue);
    HubspotRequest.requestConnectorHubspot(data,
      function () {
        self._hasError = false;
        self._goToStep(4);
        self._resetInput();
        self._disableSubmit();
      },
      function () {
        self._hasError = true;
      });
  },

  _resetInput: function () {
    this.$('.js-input').val('');
  },

  _disableSubmit: function () {
    this.$('.js-submit').attr('disabled', 'disabled');
    this.$('.js-submit').addClass('is-disabled');
  },

  _enableSubmit: function () {
    this.$('.js-submit').removeAttr('disabled');
    this.$('.js-submit').removeClass('is-disabled');
  }
});
