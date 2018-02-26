var Backbone = require('backbone');

/**
 * Model representing the query string params for a "paged search" of a collection (matching the server-side APIs).
 *
 * @example usage
 *   pagedSearch = new PaginationSearchModel({ … })
 *   pagedSearch.fetch(collection) // => jqXHR, GET /collection/123?page=1&per_page20
 *   pagedSearch.set({ page: 2, per_page: 10, q: 'test' });
 *   pagedSearch.fetch(collection) // => GET /collection/123?page=2&per_page10&q=test
 */
module.exports = Backbone.Model.extend({

  defaults: {
    per_page: 20,
    page: 1,
    q: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.collection) throw new Error('collection is required');
    if (!opts.collection.totalCount) throw new Error('collection requires to implement totalCount method');

    this.collection = opts.collection;
    this._initBinds();
  },

  _initBinds: function () {
    this.collection.on('sync', this._updateStateFetched, this);
    this.collection.on('error', this._updateStateError, this);
  },

  fetch: function () {
    this.trigger('fetching', this);
    return this.collection.fetch({
      data: this.attributes
    }, {reset: true});
  },

  _updateStateFetched: function () {
    this.trigger('fetched', this);
  },

  _updateStateError: function () {
    this.trigger('error', this);
  }
});
