var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

/**
 *  Decide what support block app should show
 *
 */

module.exports = cdb.core.View.extend({
  className: 'SupportBanner',

  initialize: function () {
    this.template = cdb.templates.getTemplate('common/views/support_banner');

    this._initModels();
  },

  render: function () {
    this.$el.html(
      this.template({
        userType: this._getUserType(),
        orgDisplayEmail: this._getOrgAdminEmail(),
        isViewer: this.user.isViewer()
      })
    );

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
  },

  _getUserType: function () {
    var accountType = this.user.get('account_type').toLowerCase();

    // Get user type
    if (this.user.isOrgOwner()) {
      return 'org_admin';
    } else if (this.user.isInsideOrg()) {
      return 'org';
    } else if (_.contains(['internal', 'partner', 'ambassador'], accountType)) {
      return 'internal';
    } else if (accountType !== 'free') {
      return 'client';
    } else {
      return 'regular';
    }
  },

  _getOrgAdminEmail: function () {
    if (this.user.isInsideOrg()) {
      return this.user.organization.display_email;
    } else {
      return null;
    }
  }
});
