var cdb = require('cartodb.js');
var Utils = require('cdb.Utils')

/**
 *  Limits reach content
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/limits_reach/limits_reached_content');
    this._initBinds();
  },

  render: function() {
    var canUpgrade = cdb.config.get('upgrade_url') && !cdb.config.get('custom_com_hosted') && !this.model.isInsideOrg();

    var availablePlans = this.collection.map(function(plan) {
      return {
        name: plan.get('title').toLowerCase(),
        price: Utils.formatNumber(plan.get('price')),
        quota: Utils.readablizeBytes(plan.get('bytes_quota')).replace(/\.00/g,''),
        layers: plan.get('max_layers'),
        privateMaps: plan.get('private_tables'),
        removableBrand: plan.get('removable_brand')
      }
    });

    this.$el.html(
      this.template({
        canUpgrade: canUpgrade,
        availablePlans: availablePlans,
        organizationAdmin: this.model.isOrgAdmin(),
        organizationUser: (this.model.isInsideOrg() && !this.model.isOrgAdmin()),
        customHosted: cdb.config.get('custom_com_hosted'),
        upgradeURL: cdb.config.get('upgrade_url')
      })
    );

    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  }

})
