var cdb = require('cartodb.js-v3');

/**
 * Model that encapsulates params for fetching data in a cdb.admin.Visualizations collection.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    content_type:   '',
    page:           1,
    q:              '',
    tag:            '',
    category:       '',
    shared:         'no',
    locked:         false,
    library:        false,
    order:          'updated_at',
    deepInsights:   false
  },

  isSearching: function() {
    return this.get('q') || this.get('tag');
  },

  isDatasets: function() {
    return this.get('content_type') === 'datasets';
  },

  isMaps: function() {
    return this.get('content_type') === 'maps';
  },

  isDeepInsights: function() {
    return this.isMaps() && this.get('deepInsights');
  }
});
