cdb.admin.Navigation = cdb.core.Model.extend({
  defaults: {
    account_host: ''
  },

  upgradeUrl: function(user) {
    return window.location.protocol + '//' + this.get('account_host') + "/account/" + user.get('username') + "/upgrade";
  }
});
