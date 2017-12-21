var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({

  className: 'Form-footer',

  initialize: function () {
    this.template = cdb.templates.getTemplate('organization/organization_users/organization_users_footer');
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      this.template({
        seats: this.model.get('seats'),
        users: this.options.organizationUsers.totalCount(),
        newUserUrl: this.model.viewUrl().create(),
        upgradeUrl: window.upgrade_url,
        customHosted: cdb.config.get('cartodb_com_hosted')
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:total_users', this.render, this);
    this.options.organizationUsers.bind('reset', this.render, this);
    this.add_related_model(this.options.organizationUsers);
  }
});
