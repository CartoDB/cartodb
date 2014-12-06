var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var bytesToSize = require('./bytes_to_size');

module.exports = cdb.admin.DropdownMenu.extend({
  initialize: function(args) {
    this.constructor.__super__.initialize.apply(this);

    this.navigation = args.navigation;
    this.add_related_model(this.navigation);
  },

  render: function() {
    var user = this.model;
    var usedDataBytes = user.get('db_size_in_bytes');
    var availableDataSize = user.get('quota_in_bytes');

    this.$el.html(this.template_base({
      username:    user.get('username'),
      email:       user.get('email'),
      accountType: user.get('account_type'),

      usedDataStr:      bytesToSize(usedDataBytes).toString(),
      usedDataPct:      Math.round(usedDataBytes/availableDataSize * 100),
      availableDataStr: bytesToSize(availableDataSize).toString(),
      showUpgradeLink:  this.navigation.hasUpgradeUrl() && (user.isOrgAdmin() || !user.isInsideOrg()),
      upgradeUrl:       this.navigation.upgradeUrl(),

      publicProfileUrl:   this.navigation.publicProfileUrl(user),
      apiKeysUrl:         this.navigation.apiKeysUrl(),
      accountSettingsUrl: this.navigation.accountSettingsUrl(user),
      logoutUrl:          this.navigation.logoutUrl()
    }));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind("closeDialogs", this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  }
});
