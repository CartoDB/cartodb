var cdb = require('cartodb.js-v3');
var HeaderView = require('../common/views/account_header_view_static');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var ProfileFormView = require('./profile_form_view');
var SupportView = require('../common/support_view_static');
var UpgradeMessage = require('../common/upgrade_message_view');
var AvatarSelector = require('../common/avatar_selector_view');
var FooterView = require('../common/footer_view_static');
var VendorScriptsView = require('../common/vendor_scripts_view');

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
      router: this.options.router,
      localStorage: new LocalStorage()
    });
    this.$('#app').prepend(headerView.render().el);

    var profileFormView = new ProfileFormView({
      authenticityToken: this.options.authenticityToken,
      user: this.options.user
    });
    this.$('#app').append(profileFormView.render().el);

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

    var avatarSelector = new AvatarSelector({
      el: this.$('.js-avatarSelector'),
      renderModel: new cdb.core.Model({
        inputName: this.$('.js-fileAvatar').attr('name'),
        name: this.user.get('name') || this.user.get('username'),
        avatar_url: this.user.get('avatar_url'),
        id: this.user.get('id')
      }),
      // TODO: avatar_valid_extensions
      // avatarAcceptedExtensions: window.avatar_valid_extensions
      avatarAcceptedExtensions: []
    });
    avatarSelector.render();

    return this;
  }
});
