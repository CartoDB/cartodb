const Backbone = require('backbone');

/**
 * Model representing the query string params for a "paged search" of a collection (matching the server-side APIs).
 *
 * @example usage
 *   const PagedSearch = require('dashboard/data/paged-search-model');
 *   pagedSearch = new PagedSearch({ … })
 *   pagedSearch.fetch(collection) // => jqXHR, GET /collection/123?page=1&per_page20
 *   pagedSearch.set({ page: 2, per_page: 10, q: 'test' });
 *   pagedSearch.fetch(collection) // => GET /collection/123?page=2&per_page10&q=test
 */
module.exports = Backbone.Model.extend({
  defaults: {
    per_page: 20,
    page: 1
    // order: 'name'
    // q: '',
  },

  fetch: function (collection) {
    collection.trigger('fetching');

    return collection.fetch({
      data: this.attributes
    });
  }
});
