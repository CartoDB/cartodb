var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.config = this.options.config;
    this.assetsVersion = this.options.assetsVersion;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/views/vendor_scripts');
  },

  render: function () {
    this.$el.html(
      this.template({
        assetsVersion: this.assetsVersion,
        intercomAppId: this.config.intercom_app_id,
        intercomEnabled: this.user && !!this.user.featureEnabled('intercom'),
        trackjsAppKey: this.config.trackjs_app_key,
        trackjsCustomer: this.config.trackjs_customer,
        trackjsEnabled: !!this.config.trackjs_enabled,
        fullstoryEnabled: !!this.config.fullstory_enabled,
        fullstoryOrg: this.config.fullstoryOrg,
        userEmail: this.user && this.user.get('email'),
        userName: this.user && this.user.get('username')
      })
    );

    return this;
  }
});
