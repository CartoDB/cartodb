var cdb = require('cartodb.js');

/**
 * View model for pagination.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    totalCount:        0,
    perPage:           10,
    page:              1,
    visibleCount:      5
  },

  pagesCount: function() {
    return Math.max(
      Math.ceil(
        this.get('totalCount') / this.get('perPage')
      ), 1);
  }
});
