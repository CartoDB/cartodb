const CoreView = require('backbone/core-view');
const template = require('./pages-subheader.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const bytesToSize = require('dashboard/helpers/bytes-to-size');

const REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    const usedDataBytes = this._userModel.get('db_size_in_bytes');
    const quotaInBytes = this._userModel.get('quota_in_bytes');
    const usedDataPct = Math.round(usedDataBytes / quotaInBytes * 100);
    let progressBarClass = '';

    if (usedDataPct > 80 && usedDataPct < 90) {
      progressBarClass = 'caution';
    } else if (usedDataPct > 89) {
      progressBarClass = 'danger';
    }

    this.$el.html(template({
      isCartoDBHosted: this._configModel.get('cartodb_com_hosted'),
      usedDataStr: bytesToSize(usedDataBytes).toString(2),
      usedDataPct: usedDataPct,
      progressBarClass: progressBarClass,
      availableDataStr: bytesToSize(quotaInBytes).toString(2),
      profileUrl: this._userModel.viewUrl().accountProfile().pathname(),
      accountUrl: this._userModel.viewUrl().accountSettings().pathname(),
      apiKeysUrl: this._userModel.viewUrl().apiKeys().pathname(),
      connectedAppsUrl: this._userModel.viewUrl().connectedApps().pathname(),
      connectionsUrl: this._userModel.viewUrl().connections().pathname(),
      isInsideOrg: this._userModel.isInsideOrg(),
      hasDirectDBConnection: this._userModel.featureEnabled('dbdirect'),
      planUrl: this._userModel.get('plan_url'),
      isOrgAdmin: this._userModel.isOrgAdmin(),
      organizationUrl: this._userModel.viewUrl().organization().pathname(),
      isOrgOwner: this._userModel.isOrgOwner(),
      upgradeContactEmail: this._userModel.upgradeContactEmail(),
      path: this.getPath()
    }));

    return this;
  },

  getPath: function () {
    return window.location.pathname;
  }
});
