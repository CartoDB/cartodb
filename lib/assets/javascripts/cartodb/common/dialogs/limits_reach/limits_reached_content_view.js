var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils')

/**
 *  Limits reach content
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggler': '_onLumpSumClick'
  },

  initialize: function() {
    this.user = this.options.user;
    this.model = new cdb.core.Model({
      lumpSum: false
    });
    this.template = cdb.templates.getTemplate('common/dialogs/limits_reach/limits_reached_content');
    this._initBinds();
  },

  render: function() {
    var canUpgrade = cdb.config.get('upgrade_url') && !cdb.config.get('cartodb_com_hosted') && !this.user.isInsideOrg();
    var currentPlan = this.user.get("account_type");

    var availablePlans = _.compact(this.collection.map(function(plan, index) {
      var price = plan.get('price');
      var planName = plan.get('title');

      return {
        name: planName.toLowerCase(),
        price: Utils.formatNumber(price),
        isUserPlan: planName.search(currentPlan) !== -1,
        lumpSumPrice: price == "0" ? "0" : Utils.formatNumber(plan.get('lump_sum').price),
        quota: Utils.readablizeBytes(plan.get('bytes_quota')).replace(/\.00/g,'').replace(" ", ""),
        layers: plan.get('max_layers'),
        privateMaps: plan.get('private_tables'),
        removableBrand: plan.get('removable_brand')
      }
    }));

    this.$el.html(
      this.template({
        lumpSum: this.model.get('lumpSum'),
        itemHighlighted: this._getHighlighted(availablePlans, this.user.get("account_type")),
        canUpgrade: canUpgrade,
        availablePlans: availablePlans,
        organizationAdmin: this.user.isOrgOwner(),
        organizationUser: (this.user.isInsideOrg() && !this.user.isOrgOwner()),
        customHosted: cdb.config.get('cartodb_com_hosted'),
        upgradeURL: cdb.config.get('upgrade_url'),
        canStartTrial: this.user.canStartTrial()
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  _getHighlighted: function(plans, currentPlan) {
    var item = 0;
    for (var i = 0, l = plans.length; i < l; i++) {
      if (plans[i].name.search(currentPlan) !== -1) {
        item = i;
      }
    }
    return item < 2 ? 2 : 3;
  },

  _onLumpSumClick: function() {
    this.model.set('lumpSum', !this.model.get('lumpSum'));
  }

})
