var cdbadmin = require('cdb.admin');

module.exports = cdbadmin.DropdownMenu.extend({
  render: function() {
    var user = this.model;

    this.$el.html(this.template_base({
      username:    user.get('username'),
      email:       user.get('email'),
      accountType: user.get('account_type'),

      usedDataStr: '25GB',
      usedDataPct: '25',
      availableDataStr: '1TB',
      showUpgradeLink: true,
      upgradeUrl: '',

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
