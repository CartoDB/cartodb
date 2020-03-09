const CoreView = require('backbone/core-view');
const template = require('./trial-notification.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'upgradeUrl',
  'trialDays'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.userAccount = this._userModel.get('account_type');
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        upgradeUrl: this._upgradeUrl,
        trialDays: this._trialDays
      })
    );

    return this;
  }
});
