var UserModel = require('../../cartodb3/data/user-model');
var UserUrlModel = require('./user-url-model');

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
    return this.get('account_type').toLowerCase().indexOf('enterprise') != -1;
  }
});
