var cdb = require('cartodb.js-v3');
var UserSettingsView = require('../public_common/user_settings_view');
var UserIndustriesView = require('../public_common/user_industries_view');

var LOGIN_URL = '/login';
var HOME_URL = '/';

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates
      .getTemplate('public/views/public_header_shared');

    this._initModels();
    this._initBindings();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(this.template({
      isHosted: this.isHosted,
      loginUrl: this.loginUrl,
      currentUser: this.currentUser
    }));

    this._renderLogoLink();
    this._updateUserSettings();

    return this;
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.isHosted = this.options.isHosted;

    this.loginUrl = this.currentUser
      ? this.currentUser.get('base_url')
      : LOGIN_URL;

    this.homeUrl = this.currentUser
      ? this.currentUser.get('base_url')
      : HOME_URL;

    this.googleEnabled = this.currentUser
      ? this.currentUser.featureEnabled('google_maps')
      : false;
  },

  _initBindings: function () {
    var authenticatedUser = new cdb.open.AuthenticatedUser();
    authenticatedUser.bind('change', this._updateUserSettings, this);
    this.add_related_model(authenticatedUser);
  },

  _renderLogoLink: function () {
    var template = cdb.templates.getTemplate('common/views/dashboard_header/logo');

    this.$('.js-logo').html(
      template({
        homeUrl: this.homeUrl,
        googleEnabled: this.googleEnabled
      })
    );
  },

  _updateUserSettings: function () {
    if (this.currentUser && this.currentUser.get('username')) {
      this.userSettingsView = new UserSettingsView({
        el: this.$('.js-user-settings'),
        model: this.currentUser
      });
      this.addView(this.userSettingsView);

      this.userSettingsView.render();
      this.currentUser.fetch();
    }

    this.userIndustriesView = new UserIndustriesView({
      el: this.$('.js-user-industries')
    });
    this.addView(this.userIndustriesView);
  }
});
