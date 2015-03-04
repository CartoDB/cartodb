/**
 * URLs associated with the dashboard visualizations.
 */
cdb.common.DashboardVisUrl = cdb.common.Url.extend({

  lockedItems: function() {
    return this.toPath('locked');
  },

  sharedItems: function() {
    return this.toPath('shared');
  },

  likedItems: function() {
    return this.toPath('liked');
  }
});
