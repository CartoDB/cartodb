var DashboardUrl = require('./abstract_dashboard_model');

/**
 * Represents a maps URL.
 */
module.exports = DashboardUrl.extend({

  initialize: function() {
    this.set('contentType', 'maps');
  },

  toDefault: function() {
    return this._toStr();
  }
});
