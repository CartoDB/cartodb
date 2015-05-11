var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

/**
 *  Upgrade message for settings pages
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/upgrade_message');
    this._initBinds();
  },

  render: function() {
    var canUpgrade = window.upgrade_url && !cdb.config.get('custom_com_hosted') && (!this.model.isInsideOrg() || this.model.isOrgAdmin() );
    
    this.$el.html(
      this.template({
        canUpgrade: canUpgrade,
        closeToLimits: this.model.isCloseToLimits(),
        quotaPer: (this.model.get('remaining_byte_quota') * 100) / this.model.get('quota_in_bytes'),
        upgradeUrl: window.upgrade_url,
        showTrial: this.model.canStartTrial()
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  }

});