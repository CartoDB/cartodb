var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/private_header_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var ProfileContentView = require('./profile_content_view');
var SupportView = require('../common/support_view_static');
var UpgradeMessage = require('../common/upgrade_message_view_static');
var FooterView = require('../common/footer_view_static');
var VendorScriptsView = require('../common/vendor_scripts_view');
var TrialNotificationView = require('../common/trial_notification/trial_notification_view');
var FlashMessageModel = require('../common/flash_message_model');
var FlashMessageView = require('../common/flash_message_view');

var PERSONAL_30_ACCOUNT = 'PERSONAL30';

module.exports = cdb.core.View.extend({
  initialize: function () {
    this._initModels();
    this._initViews();
  },

  _initModels: function () {
    this._userModel = this.options.user;
    this.config = this.options.config;
  },

  _initViews: function () {
    var headerView = new HeaderView({
      model: this._userModel,
      viewModel: new HeaderViewModel(),
      localStorage: new LocalStorage()
    });
    this.$('#app').prepend(headerView.render().el);
    this.addView(headerView);

    if (this._userModel.get('account_type') === PERSONAL_30_ACCOUNT) {
      var trialNotificationView = new TrialNotificationView({
        user: this._userModel,
        accountUpdateUrl: this.config.account_update_url,
      });
      this.$('#app').append(trialNotificationView.render().el);
      this.addView(trialNotificationView);
    }

    var flashMessageModel = new FlashMessageModel();
    var flashMessageView = new FlashMessageView({
      model: flashMessageModel
    });
    flashMessageView.render();
    flashMessageView.$el.insertAfter(headerView.$el);
    this.addView(flashMessageView);

    var profileContentView = new ProfileContentView({
      config: this.config,
      user: this._userModel,
      flashMessageModel: flashMessageModel
    });
    this.$('#app').append(profileContentView.render().el);
    this.addView(profileContentView);

    var supportView = new SupportView({
      user: this._userModel
    });
    this.$('#app').append(supportView.render().el);
    this.addView(supportView);

    var upgradeMessage = new UpgradeMessage({
      model: this._userModel
    });
    this.$('.Header').after(upgradeMessage.render().el);
    this.addView(upgradeMessage);

    var footerView = new FooterView();
    this.$('#app').append(footerView.render().el);
    this.addView(footerView);

    var vendorScriptsView = new VendorScriptsView({
      config: this.config,
      assetsVersion: this.options.assetsVersion,
      user: this._userModel
    });
    this.$el.append(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);

    return this;
  }
});
