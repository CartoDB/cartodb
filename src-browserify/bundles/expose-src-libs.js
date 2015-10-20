var sanitize = require('../core/sanitize')

// Adds src libs to the given object.
// Extracted for the individual source files, expected to be called on a bundle entry file on the bundle object that's
// exposed in the global namespace (typically window.cartodb).
// @param {Object} cdb
module.exports = function(cdb) {
  cdb.core = {
    sanitize: sanitize
  };
}
