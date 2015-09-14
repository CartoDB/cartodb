var _ = require('underscore');
var queryString = require('query-string');
var cdb = require('cartodb.js');

/**
 * Model representing the query string params for a "paged search" of a collection (matching the server-side APIs).
 * @example usage
 *   var PagedSearch = require('common/paged_search_model');
 *   PagedSearch.setupCollection(collection)
 *   collection.params.get('page'); // => 1
 *   collection.params.get('per_page'); // => 20
 *   collection.params.set({ page: 2, per_page: 10, q: 'test' });
 *   collection.fetch() // => GET /collection/123?page=2&per_page10&q=test
 *   collection.total_entries // => 123 count of search results with current search
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    per_page: 20,
    page: 1
    // order: 'name'
    // q: '',
  }

}, {

  /**
   * @param {Backbone.Collection} collection
   * @param {Object} defaultParams hash of default params to set
   */
  setupCollection: function(collection, defaultParams) {
    collection.params = new this(defaultParams);

    collection.parse = _.wrap(collection.parse, function(originalFn, response) {
      collection.total_entries = response.total_entries; // Total entries for current params (e.g. query)
      return originalFn.call(collection, response);
    });

    collection.url = _.wrap(collection.url, function(originalFn) {
      return originalFn.call(collection) + '?' + queryString.stringify(collection.params.attributes);
    });

    collection.fetch = _.wrap(collection.fetch, function(originalFetch) {
      this.trigger('loading');
      originalFetch.apply(collection, Array.prototype.slice.call(arguments, 1));
    });
  }

});
