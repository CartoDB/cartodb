var UrlModel = require('dashboard/data/url-model');

/**
 * URLs associated with the dashboard visualizations.
 */
var DashboardVisUrl = UrlModel.extend({
  lockedItems: function () {
    return this.urlToPath('locked');
  },

  sharedItems: function () {
    return this.urlToPath('shared');
  },

  likedItems: function () {
    return this.urlToPath('liked');
  }
});

module.exports = DashboardVisUrl;
