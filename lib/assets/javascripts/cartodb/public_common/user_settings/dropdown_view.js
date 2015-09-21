var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var $ = require('jquery');
var bytesToSize = require('../../common/view_helpers/bytes_to_size');

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

  initialize: function() {
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('public_common/user_settings/dropdown_template');

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);
  },

  render: function() {
    var user = this.model;
    var userUrl = user.viewUrl();
    var usedDataBytes = user.get('db_size_in_bytes');
    var quotaInBytes = user.get('quota_in_bytes');
    var usedDataPct = Math.round(usedDataBytes / quotaInBytes * 100);
    var progressBarClass = '';

    if (usedDataPct > 80 && usedDataPct < 90) {
      progressBarClass = 'is--inAlert';
    } else if (usedDataPct > 89) {
      progressBarClass = 'is--inDanger';
    }

    var accountType = user.get('account_type').toLowerCase();

    if (accountType === 'organization user') {
      accountType = 'org. user';
    } else if (accountType.search('lump-sum') !== -1) {
      accountType = accountType.replace(/lump-sum/gi, 'LP');
    } else if (accountType.search('academic') !== -1) {
      accountType = accountType.replace(/academic/gi, 'aca.');
    }

    this.$el.html(this.template_base({
      name: user.get('name') || user.get('username'),
      email: user.get('email'),
      accountType: accountType,
      usedDataPct: usedDataPct,
      progressBarClass: progressBarClass,
      availableDataStr: bytesToSize(quotaInBytes).toString(2),
      showUpgradeLink: user.get('upgrade_url') && (user.isOrgAdmin() || !user.isInsideOrg()) && !cdb.config.get('cartodb_com_hosted'),
      upgradeUrl: user.get('upgrade_url'),
      isOrgAdmin: user.isOrgAdmin(),
      usedDataStr: bytesToSize(usedDataBytes).toString(2),
      organizationUrl: userUrl.urlToPath('organization').get('base_url'),
      dashboardUrl: userUrl.dashboard(),
      apiKeysUrl: userUrl.apiKeys(),
      accountSettingsUrl: userUrl.accountSettings(),
      logoutUrl: userUrl.logout()
    }));

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  clean: function() {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind('click', this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }

});
