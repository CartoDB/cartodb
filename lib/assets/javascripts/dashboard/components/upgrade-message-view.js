const CoreView = require('backbone/core-view');
const template = require('./upgrade-message.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel'
];

/**
 *  Upgrade message for settings pages
 *
 */

module.exports = CoreView.extend({

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    var upgradeUrl = this._configModel.get('upgrade_url');
    var canUpgrade = upgradeUrl && !this._configModel.get('cartodb_com_hosted') && (!this._userModel.isInsideOrg() || this._userModel.isOrgOwner());

    this.$el.html(
      template({
        canUpgrade: canUpgrade,
        closeToLimits: this._userModel.isCloseToLimits(),
        upgradeableWithoutContactingSales: !this._userModel.isEnterprise(),
        quotaPer: (this._userModel.get('remaining_byte_quota') * 100) / this._userModel.get('quota_in_bytes'),
        upgradeUrl: upgradeUrl,
        showTrial: this._userModel.canStartTrial()
      })
    );
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._userModel, 'change', this.render);
  }
});
