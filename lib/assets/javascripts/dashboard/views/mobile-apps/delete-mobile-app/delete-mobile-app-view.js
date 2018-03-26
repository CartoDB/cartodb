const CoreView = require('backbone/core-view');
const template = require('./delete-mobile-app.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel',
  'configModel',
  'authenticityToken'
];

module.exports = CoreView.extend({
  events: {
    'submit .js-form': '_close',
    'click .cancel': '_close'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    const mobileAppId = this.options.mobileApp.id;

    this.$el.html(
      template({
        formAction: `${this._configModel.prefixUrl()}/your_apps/mobile/${mobileAppId}`,
        authenticityToken: this._authenticityToken
      })
    );
  },

  _close: function () {
    this._modalModel.destroy();
  }
});
