var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var bytesToSize = require('./bytes_to_size');

/**
 * The content of the dropdown menu opened by the user avatar in the top-right of the header, e.g.:
 *   Explore, Learn, ♞
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({

  initialize: function() {
    this.elder('initialize');
    this.router = this.options.router;
  },

  render: function() {
    var user = this.model;
    var usedDataBytes = user.get('db_size_in_bytes');
    var availableDataSize = user.get('quota_in_bytes');
    var usedDataPct = Math.round(usedDataBytes/availableDataSize * 100);
    var progressBarClass = '';

    if (usedDataPct > 70 && usedDataPct < 91) {
      progressBarClass = 'is--inAlert';
    } else if (usedDataPct > 90) {
      progressBarClass = 'is--inDanger';
    }

    var accountType = user.get('account_type').toLowerCase();

    if (accountType === "organization user") {
      accountType = "org. user"
    } else if (accountType.search('lump-sum') !== -1) {
      accountType = accountType.replace(/lump-sum/gi, 'LP');
    } else if (accountType.search('academic') !== -1) {
      accountType = accountType.replace(/academic/gi, 'aca.');
    }
    
    var currentUserUrl = this.router.currentUserUrl;
    var upgradeAccountUrl = currentUserUrl.toUpgradeAccount();

    this.$el.html(this.template_base({
      name:         user.get('name') || user.get('username'),
      email:        user.get('email'),
      accountType:  accountType,
      isOrgAdmin:   user.isOrgAdmin(),
      usedDataStr:      bytesToSize(usedDataBytes).toString(),
      usedDataPct:      usedDataPct,
      progressBarClass: progressBarClass,
      availableDataStr: bytesToSize(availableDataSize).toString(),
      showUpgradeLink:    upgradeAccountUrl && (user.isOrgAdmin() || !user.isInsideOrg()),
      upgradeUrl:         upgradeAccountUrl,
      publicProfileUrl:   currentUserUrl.toPublicProfile(),
      apiKeysUrl:         currentUserUrl.toApiKeys(),
      accountSettingsUrl: currentUserUrl.toAccountSettings(),
      logoutUrl:          currentUserUrl.toLogout()
    }));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  clean: function() {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind("click", this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }

});
