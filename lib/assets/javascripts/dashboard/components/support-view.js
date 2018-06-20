const CoreView = require('backbone/core-view');
const template = require('./support-view/support-banner.tpl');
const checkAndBuildOpts = require('../../builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

/**
 *  Decide what support block app should show
 *
 */
module.exports = CoreView.extend({
  className: 'SupportBanner',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        userType: this._getUserType(),
        orgDisplayEmail: this._getOrgAdminEmail(),
        isViewer: this._userModel.isViewer()
      })
    );

    return this;
  },

  _getUserType: function () {
    var accountType = this._userModel.get('account_type').toLowerCase();

    // Get user type
    if (this._userModel.isOrgOwner()) {
      return 'org_admin';
    } else if (this._userModel.isInsideOrg()) {
      return 'org';
    } else if (accountType === 'internal' || accountType === 'partner' || accountType === 'ambassador') {
      return 'internal';
    } else if (accountType !== 'free') {
      return 'client';
    } else {
      return 'regular';
    }
  },

  _getOrgAdminEmail: function () {
    if (this._userModel.isInsideOrg()) {
      return this._userModel.organization && this._userModel.organization.display_email;
    }

    return null;
  }
});
