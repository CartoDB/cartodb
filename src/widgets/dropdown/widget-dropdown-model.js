var cdb = require('cartodb.js');

/**
 * Default widget dropdown model
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    collapsed: false,
    flags: {
      normalizeHistogram: false
    },
    normalized: false,
    open: false,
    pinned: false
  }
});
