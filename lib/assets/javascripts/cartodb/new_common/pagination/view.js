var cdb = require('cartodb.js');

/**
 * Responsible for pagination.
 */
module.exports = cdb.core.View.extend({
  className: 'Pagination',

  render: function() {
    return this;
  }
});
