var DashboardUrl = require('./abstract_dashboard_model');

/**
 * Represents a datasets URL.
 */
module.exports = DashboardUrl.extend({

  initialize: function() {
    this.set('contentType', 'datasets');
  },

  toDefault: function() {
    return this._toStr();
  }
});
