// Adds vendor libs to given object, typically the window.cartodb.
// Extracted from older grunt/templates/wrapper_footer, used prior to browserify
// @param {Object} cdb
module.exports = function(cdb) {
  // require order maintained from the older src/cartodb.js file
  cdb.$ = require('jquery');
  cdb._ = require('underscore');
  require('json2');
  cdb.Backbone = require('backbone');
  cdb.Mustache = require('mustache');
  cdb.L = require('leaflet');
  L.noConflict(); // to remove window.L (and restore prev object if any)
}
