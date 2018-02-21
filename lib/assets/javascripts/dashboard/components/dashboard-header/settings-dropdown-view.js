const _ = require('underscore');
const $ = require('jquery');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');
const Utils = require('builder/helpers/utils');
const template = require('./settings-dropdown.tpl');

const REQUIRED_OPTS = [
  'model',
  'configModel'
];

/**
 * The content of the dropdown menu opened by the user avatar in the top-right of the header, e.g.:
 *   Explore, Learn, ♞
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */

module.exports = DropdownAdminView.extend({
  className: 'Dropdown',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    DropdownAdminView.prototype.initialize.apply(this, arguments);
  },

  shortDisplayName: function (user) {
    // This changes should also be done in Central, ./app/assets/javascripts/dashboard/users/views/user_avatar.js
    var accountTypeDisplayName = user.get('account_type_display_name');
    var displayName = _.isUndefined(accountTypeDisplayName) ? user.get('account_type') : accountTypeDisplayName;

    if (_.isUndefined(displayName)) {
      return displayName;
    }

    displayName = displayName.toLowerCase();

    if (displayName === 'organization user') {
      return 'org. user';
    } else {
      return displayName.replace(/lump-sum/gi, '- A')
        .replace(/academic/gi, 'aca.')
        .replace(/ - Monthly/i, ' - M')
        .replace(/ - Annual/i, ' - A')
        .replace(/Non-Profit/i, 'NP')
        .replace(/On-premises/i, 'OP')
        .replace(/Internal use engine/i, 'engine')
        .replace(/Lite/i, 'L')
        .replace(/Cloud Engine &/i, 'C. Engine &')
        .replace(/& Enterprise Builder/i, '& E. Builder')
        .replace(/CARTO for /i, '')
        .replace(/CARTO /i, '');
    }
  },

  render: function () {
    var user = this.model;
    var usedDataBytes = user.get('db_size_in_bytes');
    var quotaInBytes = user.get('quota_in_bytes');
    var usedDataPct = Math.round(usedDataBytes / quotaInBytes * 100);
    var progressBarClass = '';

    if (usedDataPct > 80 && usedDataPct < 90) {
      progressBarClass = 'is--inAlert';
    } else if (usedDataPct > 89) {
      progressBarClass = 'is--inDanger';
    }

    var accountType = this.shortDisplayName(user);

    var userUrl = this.model.viewUrl();
    var upgradeUrl = window.upgrade_url || this._configModel.get('upgrade_url') || '';

    this.$el.html(template({
      name: user.fullName() || user.get('username'),
      email: user.get('email'),
      accountType: accountType,
      isOrgAdmin: user.isOrgAdmin(),
      usedDataStr: Utils.readablizeBytes(usedDataBytes),
      usedDataPct: usedDataPct,
      progressBarClass: progressBarClass,
      availableDataStr: Utils.readablizeBytes(quotaInBytes),
      showUpgradeLink: upgradeUrl && (user.isOrgOwner() || !user.isInsideOrg()) && !this._configModel.get('cartodb_com_hosted'),
      upgradeUrl: upgradeUrl,
      publicProfileUrl: userUrl.publicProfile(),
      apiKeysUrl: userUrl.apiKeys(),
      organizationUrl: userUrl.organization(),
      accountProfileUrl: userUrl.accountProfile(),
      logoutUrl: userUrl.logout(),
      isViewer: user.isViewer(),
      isBuilder: user.isBuilder(),
      orgDisplayEmail: user.isInsideOrg() ? user.organization.display_email : null,
      engineEnabled: user.get('actions').engine_enabled,
      mobileAppsEnabled: user.get('actions').mobile_sdk_enabled
    }));

    // Necessary to hide dialog on click outside popup, for example.
    // TODO: Handle closeDialogs
    // cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  }
});
