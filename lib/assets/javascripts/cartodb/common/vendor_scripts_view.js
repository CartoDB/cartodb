var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.config = this.options.config;
    this.assetsVersion = this.options.assetsVersion;
    this.user = this.options.user;
    this.appKey = this.options.appKey;
    this.template = cdb.templates.getTemplate('common/views/vendor_scripts');
  },

  render: function () {
    this.$el.html(
      this.template({
        trackjsCustomer: this.config.trackjs_customer,
        trackjsEnabled: this.config.trackjs_enabled,
        trackjsAppKey: this.config.trackjs_app_keys[this.appKey],
        assetsVersion: this.assetsVersion,
        userName: this.user.get('username'),
        ua: this.config.google_analytics_ua,
        domain: this.config.google_analytics_domain,
        memberType: this.user.get('account_type').toUpperCase(),
        hubspotEnabled: this.config.hubspot_enabled,
        hubspotToken: this.config.hubspot_token,
        hubspotIds: this.config.hubspot_ids,
        intercomEnabled: this.user.featureEnabled('intercom'),
        intercomAppId: this.config.intercom_app_id,
        userEmail: this.user.get('email')
      })
    );

    return this;
  }
});
