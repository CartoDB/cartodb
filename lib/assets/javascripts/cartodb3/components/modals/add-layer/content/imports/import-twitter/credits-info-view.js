var cdb = require('cartodb-deep-insights.js');
var Utils = require('../../../../../../helpers/utils');
var template = require('./credits-info.tpl');

/**
 *  Credits info view
 *
 *  - Percentage of use
 *  - Possible money spent
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    this._userModel = opts.userModel;
    this._initBinds();
  },

  render: function () {
    var twitterData = this._userModel.get('twitter');
    var remaining = twitterData.quota - twitterData.monthly_use;
    var per = Math.min(100, Math.ceil((this.model.get('value') * 100) / remaining));

    this.$el.html(
      template({
        value: this.model.get('value'),
        remaining: remaining,
        per: per,
        hardLimit: twitterData.hard_limit,
        remainingFormatted: Utils.formatNumber(remaining),
        quota: twitterData.quota,
        block_price: twitterData.block_price,
        block_size: Utils.readizableNumber(twitterData.block_size)
      })
    );
    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  }

});
