const CoreView = require('backbone/core-view');
const ProfileContentView = require('dashboard/views/profile/profile-content/profile-content-view');
const SupportView = require('dashboard/components/support-view');
const UpgradeMessage = require('dashboard/components/upgrade-message-view.js');
const FooterView = require('dashboard/components/footer/footer-view');
const VendorScriptsView = require('dashboard/components/vendor-scripts/vendor-scripts-view');
const TrialNotificationView = require('dashboard/components/trial-notification/trial-notification-view');
const FlashMessageModel = require('dashboard/data/flash-message-model');
const FlashMessageView = require('dashboard/components/flash-message/flash-message-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const PERSONAL_30_ACCOUNT = 'PERSONAL30';

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'assetsVersion',
  'organizationNotifications',
  'modals'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initViews();
  },

  _initViews: function () {
    const $app = this.$('#app');

    if (this._userModel.get('account_type') === PERSONAL_30_ACCOUNT) {
      const trialNotificationView = new TrialNotificationView({
        userModel: this._userModel,
        accountUpdateUrl: this._configModel.get('account_update_url')
      });
      $app.append(trialNotificationView.render().el);
      this.addView(trialNotificationView);
    }

    const flashMessageModel = new FlashMessageModel();
    const flashMessageView = new FlashMessageView({
      model: flashMessageModel
    });
    flashMessageView.render();
    flashMessageView.$el.prepend(flashMessageView.$el);
    this.addView(flashMessageView);

    const profileContentView = new ProfileContentView({
      configModel: this._configModel,
      userModel: this._userModel,
      flashMessageModel: flashMessageModel,
      modals: this._modals
    });
    $app.append(profileContentView.render().el);
    this.addView(profileContentView);

    const supportView = new SupportView({
      userModel: this._userModel
    });
    $app.append(supportView.render().el);
    this.addView(supportView);

    const upgradeMessage = new UpgradeMessage({
      userModel: this._userModel,
      configModel: this._configModel
    });
    $app.prepend(upgradeMessage.render().el);
    this.addView(upgradeMessage);

    const footerView = new FooterView({ configModel: this._configModel });
    $app.append(footerView.render().el);
    this.addView(footerView);

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
