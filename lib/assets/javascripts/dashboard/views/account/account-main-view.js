const $ = require('jquery');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const PrivateHeaderView = require('dashboard/components/private-header-view');
const HeaderViewModel = require('dashboard/views/account/header-view-model');
// var TrialNotificationView = require('../common/trial_notification/trial_notification_view');
const LocalStorage = require('dashboard/helpers/local-storage');
const AccountContentView = require('./account-content-view');
const SupportView = require('dashboard/components/support-view.js');
const UpgradeMessage = require('dashboard/components/upgrade-message-view.js');
// var FooterView = require('../common/footer_view_static');
// var VendorScriptsView = require('../common/vendor_scripts_view');
// var FlashMessageModel = require('../common/flash_message_model');
// var FlashMessageView = require('../common/flash_message_view');

var PERSONAL_30_ACCOUNT = 'PERSONAL30';

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'client'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initViews();
  },

  _initViews: function () {
    var headerView = new PrivateHeaderView({
      model: this._userModel,
      configModel: this._configModel,
      viewModel: new HeaderViewModel()
      // TODO: Mirar a ver si finalmente hace falta
      // localStorage: new LocalStorage()
    });

    $(document.body).prepend(headerView.render().el);
    this.addView(headerView);

    // if (this._userModel.get('account_type') === PERSONAL_30_ACCOUNT) {
    //   var trialNotificationView = new TrialNotificationView({
    //     user: this._userModel,
    //     accountUpdateUrl: this.config.account_update_url,
    //   });
    //   this.$('#app').append(trialNotificationView.render().el);
    //   this.addView(trialNotificationView);
    // }

    // var flashMessageModel = new FlashMessageModel();
    // var flashMessageView = new FlashMessageView({
    //   model: flashMessageModel
    // });
    // flashMessageView.render();
    // flashMessageView.$el.insertAfter(headerView.$el);
    // this.addView(flashMessageView);

    var accountContentView = new AccountContentView({
      userModel: this._userModel,
      configModel: this._configModel,
      // TODO: Poner el model bueno
      flashMessageModel: new Backbone.Model(),
      client: this._client
    });
    this.$('#app').append(accountContentView.render().el);
    this.addView(accountContentView);

    // Estos dos de abajo funcionan pero hay que ponerlos en su sitio
    var supportView = new SupportView({
      userModel: this._userModel
    });
    $('#app').append(supportView.render().el);
    this.addView(supportView);

    var upgradeMessage = new UpgradeMessage({
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.$('.Header').after(upgradeMessage.render().el);
    this.addView(upgradeMessage);

    // var footerView = new FooterView();
    // this.$('#app').append(footerView.render().el);
    // this.addView(footerView);

    // var vendorScriptsView = new VendorScriptsView({
    //   config: this.options.config,
    //   assetsVersion: this.options.assetsVersion,
    //   user: this._userModel
    // });
    // this.$el.append(vendorScriptsView.render().el);
    // this.addView(vendorScriptsView);

    return this;
  }
});
