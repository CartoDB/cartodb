var UserModel = require('cartodb3/data/user-model');
var UserUrlModel = require('dashboard/data/user-url-model');

module.exports = UserModel.extend({
  viewUrl: function () {
    return new UserUrlModel({
      base_url: this.get('base_url'),
      is_org_admin: this.isOrgAdmin()
    });
  },

  isCloseToLimits: function () {
    const quota = this.get('quota_in_bytes');
    const remainingQuota = this.get('remaining_byte_quota');

    return ((remainingQuota * 100) / quota) < 20;
  },

  isEnterprise: function () {
    return this.get('account_type').toLowerCase().indexOf('enterprise') !== -1;
  },

  getOrgName: function () {
    return this.isInsideOrg() ? this.getOrganization().get('name') : '';
  },

  getGoogleApiKey: function () {
    return this.get('google_maps_private_key');
  },

  hasGoogleMaps: function () {
    return !!this.getGoogleApiKey();
  },

  showGoogleApiKeys: function () {
    return this.hasGoogleMaps() && (!this.isInsideOrg() || this.isOrgOwner());
  }
});
