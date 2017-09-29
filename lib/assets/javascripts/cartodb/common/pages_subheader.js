var cdb = require('cartodb.js-v3');
var bytesToSize = require('../common/view_helpers/bytes_to_size');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('common/views/pages_subheader');

    this._initModels();
  },

  _initModels: function () {
    this.user = this.options.user;
  },

  render: function () {
    var usedDataBytes = this.user.get('db_size_in_bytes');
    var quotaInBytes = this.user.get('quota_in_bytes');
    var usedDataPct = Math.round(usedDataBytes / quotaInBytes * 100);
    var progressBarClass = '';

    if (usedDataPct > 80 && usedDataPct < 90) {
      progressBarClass = 'caution';
    } else if (usedDataPct > 89) {
      progressBarClass = 'danger';
    }

    this.$el.html(this.template({
      usedDataStr: bytesToSize(usedDataBytes).toString(2),
      usedDataPct: usedDataPct,
      progressBarClass: progressBarClass,
      availableDataStr: bytesToSize(quotaInBytes).toString(2),
      profileUrl: this.user.viewUrl().accountProfile().pathname(),
      accountUrl: this.user.viewUrl().accountSettings().pathname(),
      apiKeysUrl: this.user.viewUrl().apiKeys().pathname(),
      isInsideOrg: this.user.isInsideOrg(),
      planUrl: this.user.get('plan_url'),
      isOrgAdmin: this.user.isOrgAdmin(),
      organizationUrl: this.user.viewUrl().organization().pathname(),
      isOrgOwner: this.user.isOrgOwner(),
      upgradeContactEmail: this.user.upgradeContactEmail(),
      path: this.getPath()
    }));

    return this;
  },

  getPath: function () {
    return window.location.pathname;
  }
});
