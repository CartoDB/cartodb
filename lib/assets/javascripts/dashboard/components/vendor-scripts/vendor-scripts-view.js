const CoreView = require('backbone/core-view');
const template = require('./vendor-scripts.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'assetsVersion'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        assetsVersion: this._assetsVersion,
        googleAnalyticsDomain: this._configModel.get('google_analytics_domain'),
        googleAnalyticsMemberType: this._userModel.get('account_type').toUpperCase(),
        googleAnalyticsUa: this._configModel.get('google_analytics_ua'),
        googleTagManagerId: this._configModel.get('google_tag_manager_id'),
        hubspotEnabled: !!this._configModel.get('hubspot_enabled'),
        hubspotIds: this._configModel.get('hubspot_ids'),
        hubspotToken: this._configModel.get('hubspot_token'),
        intercomAppId: this._configModel.get('intercom_app_id'),
        intercomEnabled: !!this._userModel.featureEnabled('intercom'),
        trackjsAppKey: this._configModel.get('trackjs_app_key'),
        trackjsCustomer: this._configModel.get('trackjs_customer'),
        trackjsEnabled: !!this._configModel.get('trackjs_enabled'),
        fullstoryEnabled: !!this._configModel.get('fullstory_enabled'),
        fullstoryOrg: this._configModel.get('fullstoryOrg'),
        userEmail: this._userModel.get('email'),
        userName: this._userModel.get('username'),
        userId: this._userModel.get('id'),
        userAccountType: this._userModel.get('account_type'),
        userCreatedAtInSeconds: Date.parse(this._userModel.get('created_at')) / 1000
      })
    );

    return this;
  }
});
