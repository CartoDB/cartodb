var cdbadmin = require('cdb.admin');
var bytesToSize = require('new_dashboard/common/bytes_to_size');

module.exports = cdbadmin.DropdownMenu.extend({
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
      showUpgradeLink:  true,
      upgradeUrl:       '',

      publicProfileUrl: '',
      apiKeysUrl: '',
      accountSettingsUrl: '',
      logoutUrl: '/logout'
    }));

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    cdb.god.bind("closeDialogs", this.hide, this);
    $('body').append(this.el);

    return this;
  }
});
