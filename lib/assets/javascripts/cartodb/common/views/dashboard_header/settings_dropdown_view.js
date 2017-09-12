var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var $ = require('jquery-cdb-v3');
var bytesToSize = require('../../view_helpers/bytes_to_size');

/**
 * The content of the dropdown menu opened by the user avatar in the top-right of the header, e.g.:
 *   Explore, Learn, ♞
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'Dropdown',

  initialize: function () {
    this.elder('initialize');
    if (!this.model) {
      throw new Error('model is required');
    }
    this.template_base = cdb.templates.getTemplate('common/views/dashboard_header/settings_dropdown');
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
    var upgradeUrl = window.upgrade_url || cdb.config.get('upgrade_url') || '';

    this.$el.html(this.template_base({
      name: user.fullName() || user.get('username'),
      email: user.get('email'),
      accountType: accountType,
      isOrgAdmin: user.isOrgAdmin(),
      usedDataStr: bytesToSize(usedDataBytes).toString(2),
      usedDataPct: usedDataPct,
      progressBarClass: progressBarClass,
      availableDataStr: bytesToSize(quotaInBytes).toString(2),
      showUpgradeLink: upgradeUrl && (user.isOrgOwner() || !user.isInsideOrg()) && !cdb.config.get('cartodb_com_hosted'),
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
    cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  clean: function () {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind('click', this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }

});
