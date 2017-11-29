var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('common/trial_notification/trial_notification');

    this._initModels();
  },

  _initModels: function () {
    this.userAccount = this.options.user.get('account_type');
    this.accountUpdateUrl = this.options.accountUpdateUrl;
  },

  render: function () {
    var accountUpdateUrl = window.location.protocol + '//' + this.accountUpdateUrl;

    this.clearSubViews();

    this.$el.html(this.template({
      accountUpdateUrl: accountUpdateUrl
    }));

    return this;
  }
});
