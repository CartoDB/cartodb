/**
 * URLs associated with the dashboard visualizations.
 */
cdb.common.DashboardVisUrl = cdb.common.Url.extend({

  lockedItems: function() {
    return this.urlToPath('locked');
  },

  sharedItems: function() {
    return this.urlToPath('shared');
  },

});
