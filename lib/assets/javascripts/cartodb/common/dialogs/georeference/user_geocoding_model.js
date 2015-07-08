var cdb = require('cartodb.js');

/**
 * A value object to encapsulate logic related to user view model.
 *
 * Expected to be create with geocoding value from an user, e.g.:
 *   new UserGeocoding(user.get('geocoding'));
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    quota: null, // is based on monthly usage
    block_price: null,
    monthly_use: 0,
    hard_limit: false
  },

  hasQuota: function() {
    var quota = this.get('quota');
    return quota !== null && quota !== undefined && quota !== '';
  },

  hasReachedMonthlyQuota: function() {
    return this.get('hard_limit') && this._maybe(function(quota, monthlyUse) {
      return (monthlyUse >= quota);
    }, false);
  },

  quotaLeftThisMonth: function() {
    return this._maybe(function(quota, monthlyUse) {
      return quota - monthlyUse;
    }, 0);
  },

  quotaUsedThisMonthInPct: function() {
    return this._maybe(function(quota, monthlyUse) {
      return (monthlyUse * 100) / quota;
    }, 0);
  },

  // Make sure monthly_use and quota are set
  _maybe: function(fn, fallbackVal) {
    var monthlyUse = this.get('monthly_use');
    var quota = this.get('quota');

    if (monthlyUse >= 0 && quota > 0) {
      return fn(quota, monthlyUse);
    } else {
      return fallbackVal;
    }
  }

});
