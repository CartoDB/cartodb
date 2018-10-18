const CoreView = require('backbone/core-view');
const template = require('./trial-notification.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'accountUpdateUrl'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.userAccount = this._userModel.get('account_type');
  },

  render: function () {
    const accountUpdateUrl = `${window.location.protocol}//${this._accountUpdateUrl}`;
    this.clearSubViews();

    this.$el.html(
      template({ accountUpdateUrl })
    );

    return this;
  }
});
