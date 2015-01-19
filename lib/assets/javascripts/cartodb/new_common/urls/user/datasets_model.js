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
  },
  
  toDataset: function(table) {
    // TODO: Points to old table URL, needs to be updated once the editor is ready
    return this._toStrWithoutBasePath('tables', table.getUnquotedName());
  }
});
