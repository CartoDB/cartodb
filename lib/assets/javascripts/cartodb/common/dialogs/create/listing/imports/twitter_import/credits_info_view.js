var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');

/**
 *  Credits info view
 *
 *  - Percentage of use
 *  - Possible money spent
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this._initBinds();
    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/credits_info');
  },

  render: function() {
    var twitterData = this.user.get('twitter');
    var remaining = twitterData.quota - twitterData.monthly_use;
    var per = Math.min(100,Math.ceil((this.model.get('value') * 100) / remaining));

    this.$el.html(
      this.template({
        value: this.model.get('value'),
        remaining: remaining,
        per: per,
        hardLimit: twitterData.hard_limit,
        remainingFormatted: Utils.formatNumber(remaining),
        quota: twitterData.quota,
        block_price: twitterData.block_price,
        block_size: Utils.readizableNumber(twitterData.block_size)
      })
    )
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  }

});