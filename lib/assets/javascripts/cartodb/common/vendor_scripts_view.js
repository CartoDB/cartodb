var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.config = this.options.config;
    this.assetsVersion = this.options.assetsVersion;
    this.user = this.options.user;
    this.trackjsAppKey = this.options.trackjsAppKey || 'editor';
    this.googleAnalyticsTrack = this.options.googleAnalyticsTrack;
    this.googleAnalyticsPublicView = this.options.googleAnalyticsPublicView || false;
    this.googleAnalyticsCustomVars = this.options.googleAnalyticsCustomVars;
    this.template = cdb.templates.getTemplate('common/views/vendor_scripts');
  },

  render: function () {
    this.$el.html(
      this.template({
        trackjsCustomer: this.config.trackjs_customer,
        trackjsEnabled: this.config.trackjs_enabled,
        trackjsAppKey: this.config.trackjs_app_keys[this.trackjsAppKey],
        assetsVersion: this.assetsVersion,
        userName: this.user.get('username'),
        googleAnalyticsUa: this.config.google_analytics_ua[this.googleAnalyticsTrack],
        googleAnalyticsDomain: this.config.google_analytics_domain,
        googleAnalyticsMemberType: this.user.get('account_type').toUpperCase(),
        googleAnalyticsPublicView: this.googleAnalyticsPublicView,
        googleAnalyticsCustomVars: this.googleAnalyticsCustomVars,
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
