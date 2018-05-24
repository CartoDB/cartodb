const CoreView = require('backbone/core-view');
const template = require('./regenerate-keys.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel',
  'type',
  'scope',
  'form_action',
  'passwordNeeded',
  'authenticity_token'
];

module.exports = CoreView.extend({
  events: {
    'click .js-cancel': '_closeDialog'
  },

  defaults: {
    method: 'post'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._method = this.options.method;
  },

  render: function () {
    return this.$el.html(template({
      type: this._type,
      scope: this._scope,
      form_action: this._form_action,
      passwordNeeded: this._passwordNeeded,
      authenticity_token: this._authenticity_token,
      method: this._method
    }));
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
