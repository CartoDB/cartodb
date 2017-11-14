var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/private_header_view');
var HeaderViewModel = require('../profile/header_view_model');
var LocalStorage = require('../common/local_storage');
var AccountContentView = require('./account_content_view');
var SupportView = require('../common/support_view_static');
var UpgradeMessage = require('../common/upgrade_message_view');
var FooterView = require('../common/footer_view_static');
var VendorScriptsView = require('../common/vendor_scripts_view');
var FlashMessageModel = require('../common/flash_message_model');
var FlashMessageView = require('../common/flash_message_view');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this._initModels();
    this._initViews();
  },

  _initModels: function () {
    this._userModel = this.options.user;
    this._client = this.options.client;
  },

  _initViews: function () {
    var headerView = new HeaderView({
      model: this._userModel,
      viewModel: new HeaderViewModel(),
      localStorage: new LocalStorage()
    });
    this.$('#app').prepend(headerView.render().el);
    this.addView(headerView);

    var flashMessageModel = new FlashMessageModel();
    var flashMessageView = new FlashMessageView({
      model: flashMessageModel
    });
    flashMessageView.render();
    flashMessageView.$el.insertAfter(headerView.$el);
    this.addView(flashMessageView);

    var accountContentView = new AccountContentView({
      user: this._userModel,
      flashMessageModel: flashMessageModel,
      client: this._client
    });
    this.$('#app').append(accountContentView.render().el);
    this.addView(accountContentView);

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
      config: this.options.config,
      assetsVersion: this.options.assetsVersion,
      user: this._userModel
    });
    this.$el.append(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);

    return this;
  }
});
