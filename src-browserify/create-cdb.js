var sanitize = require('./core/sanitize')
var decorators = require('./core/decorators');
var Config = require('./core/config');

// Create the cartodb object to be set in the global namespace.
// Code extracted from the older src/cartodb.js file (entry file prior to browerify)
// @param {Object} opts
// @return {Object} the object to be set in the global namespace, typically window.cartodb.
module.exports = function(opts) {
  opts = opts || {};
  var cdb = {};

  cdb.$ = opts.jQuery;
  cdb._ = require('underscore');
  require('json2');
  cdb.Backbone = require('backbone');
  cdb.Mustache = require('mustache');
  cdb.L = require('leaflet');
  L.noConflict(); // to remove window.L (and restore prev object if any)

  cdb.core = {
    sanitize: sanitize
  };
  cdb.decorators = decorators;
  cdb.config = new Config();
  cdb.config.set({
    cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
    cartodb_logo_link: "http://www.cartodb.com"
  });

  return cdb;
};
