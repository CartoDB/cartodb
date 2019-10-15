const CoreView = require('backbone/core-view');
const template = require('./delete-mobile-app.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel',
  'configModel',
  'authenticityToken',
  'needsPasswordConfirmation'
];

module.exports = CoreView.extend({
  events: {
    'submit .js-form': '_close',
    'click .js-cancel': '_close'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    const mobileAppId = this.options.mobileApp.id;

    this.$el.html(
      template({
        formAction: `${this._configModel.get('base_url')}/your_apps/mobile/${mobileAppId}`,
        authenticityToken: this._authenticityToken,
        passwordNeeded: this._needsPasswordConfirmation
      })
    );
  },

  _close: function () {
    this._modalModel.destroy();
  }
});
