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
    return parseInt(this.get('quota')) >= 0;
  },

  hasReachedMonthlyQuota: function() {
    return this.get('monthly_use') >= this.get('quota') && this.get('hard_limit');
  }

});
