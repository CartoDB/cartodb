var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.config = this.options.config;
    this.assetsVersion = this.options.assetsVersion;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('./views/vendor_scripts');
  },

  render: function () {
    this.$el.html(
      this.template({
        trackjsCustomer: this.config.trackjs_customer,
        trackjsEnabled: this.config.trackjs_enabled,
        trackjsAppKey: this.config.trackjs_app_key,
        assetsVersion: this.assetsVersion,
        userName: this.user.get('username'),
        ua: this.config.google_analytics_ua,
        domain: this.config.google_analytics_domain,
        memberType: this.user.get('account_type').toUpperCase(),
        hubspot_token: this.config.hubspot_token
      })
    );

    return this;
  }
});
