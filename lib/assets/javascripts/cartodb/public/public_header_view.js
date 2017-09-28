var cdb = require('cartodb.js-v3');
var LOGIN_URL = '/login';
var HOME_URL = '/';

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public/views/public_header_shared');
    this._initModels();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.template({
      isHosted: this.isHosted,
      loginUrl: this.loginUrl
    }));

    this._renderLogoLink();

    return this;
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.userUrl = this.options.userUrl;
    this.isHosted = this.options.isHosted;

    this.loginUrl = this.currentUser
      ? this.currentUser.attributes.base_url
      : LOGIN_URL;

    this.homeUrl = this.currentUser
      ? this.currentUser.attributes.base_url
      : HOME_URL;

    this.googleEnabled = this.currentUser
      ? this.currentUser.featureEnabled('google_maps')
      : false;
  },

  _renderLogoLink: function () {
    var template = cdb.templates.getTemplate('common/views/dashboard_header/logo');

    this.$('.js-logo').html(
      template({
        homeUrl: this.homeUrl,
        googleEnabled: this.googleEnabled
      })
    );
  }
});
