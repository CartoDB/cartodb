var cdb = require('cartodb.js');

/**
 * View model for pagination.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    totalCount:        0,
    perPage:           0,
    page:              1,
    visibleCount:      5
  }
});
