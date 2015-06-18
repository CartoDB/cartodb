var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');

/**
 *  Organization users form footer
 *
 */

module.exports = cdb.core.View.extend({

  className: 'Form-footer',

  initialize: function() {
    this.template = cdb.templates.getTemplate('organization/organization_users/organization_users_footer');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        seats: this.model.get('seats'),
        users: this.model.get('total_users'),
        newUserUrl: this.model.viewUrl().create(),
        upgradeUrl: window.upgrade_url,
        customHosted: cdb.config.get('custom_com_hosted')
      })
    )
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:total_users', this.render, this);
  }

})