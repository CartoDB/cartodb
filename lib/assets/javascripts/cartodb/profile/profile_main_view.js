var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/private_header_view');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var ProfileContentView = require('./profile_content_view');
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
    this.user = this.options.user;
  },

  _initViews: function () {
    var headerView = new HeaderView({
      model: this.user,
      viewModel: new HeaderViewModel(),
      localStorage: new LocalStorage()
    });
    this.$('#app').prepend(headerView.render().el);

    var flashMessageModel = new FlashMessageModel();
    var flashMessageView = new FlashMessageView({
      model: flashMessageModel
    });
    flashMessageView.render();
    flashMessageView.$el.insertAfter(headerView.$el);

    var profileContentView = new ProfileContentView({
      user: this.user,
      flashMessageModel: flashMessageModel
    });
    this.$('#app').append(profileContentView.render().el);

    var supportView = new SupportView({
      user: this.user
    });
    this.$('#app').append(supportView.render().el);

    var upgradeMessage = new UpgradeMessage({
      model: this.user
    });
    this.$('.Header').after(upgradeMessage.render().el);

    var footerView = new FooterView();
    this.$('#app').append(footerView.render().el);

    var vendorScriptsView = new VendorScriptsView({
      config: this.options.config,
      assetsVersion: this.options.assetsVersion,
      user: this.user
    });
    this.$el.append(vendorScriptsView.render().el);

    return this;
  }
});
