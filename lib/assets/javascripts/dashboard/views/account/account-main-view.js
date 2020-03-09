const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const TrialNotificationView = require('dashboard/components/trial-notification/trial-notification-view');
const AccountContentView = require('./account-content-view');
const UpgradeMessage = require('dashboard/components/upgrade-message-view.js');
const VendorScriptsView = require('dashboard/components/vendor-scripts/vendor-scripts-view');
const FlashMessageModel = require('dashboard/data/flash-message-model');
const FlashMessageView = require('dashboard/components/flash-message/flash-message-view');
var moment = require('moment');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'client',
  'assetsVersion',
  'organizationNotifications'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initViews();
  },

  _initViews: function () {
    const $app = this.$('#app');

    if (this._userModel.get('show_trial_reminder') === true) {
      const trialEndsAt = moment(this._userModel.get('trial_ends_at'));
      const now = moment();
      const trialNotificationView = new TrialNotificationView({
        userModel: this._userModel,
        upgradeUrl: this._configModel.get('upgrade_url'),
        trialDays: Math.ceil(trialEndsAt.diff(now, 'days', true))
      });
      $app.append(trialNotificationView.render().el);
      this.addView(trialNotificationView);
    }

    const flashMessageModel = new FlashMessageModel();

    const flashMessageView = new FlashMessageView({
      model: flashMessageModel
    });
    $app.prepend(flashMessageView.render().el);
    this.addView(flashMessageView);

    const accountContentView = new AccountContentView({
      userModel: this._userModel,
      configModel: this._configModel,
      flashMessageModel,
      client: this._client
    });
    $app.append(accountContentView.render().el);
    this.addView(accountContentView);

    const upgradeMessage = new UpgradeMessage({
      userModel: this._userModel,
      configModel: this._configModel
    });
    $app.prepend(upgradeMessage.render().el);
    this.addView(upgradeMessage);

    const vendorScriptsView = new VendorScriptsView({
      configModel: this._configModel,
      assetsVersion: this._assetsVersion,
      userModel: this._userModel
    });
    this.$el.append(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);

    return this;
  }
});
