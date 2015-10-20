var _ = require('underscore');
require('json2'); // polyfills window.JSON if necessary
var Backbone = require('backbone');
var Mustache = require('mustache');
var Leaflet = require('leaflet');
var sanitize = require('./core/sanitize')
var decorators = require('./core/decorators');
var Config = require('./core/config');
var Log = require('./core/log');
var ErrorList = require('./core/log/error-list');
var Profiler = require('./core/profiler');
var Template = require('./core/template');
var TemplateList = require('./core/template-list');

// Create the cartodb object to be set in the global namespace.
// Code extracted from the older src/cartodb.js file (entry file prior to browerify)
// @param {Object} opts
// @return {Object} the object to be set in the global namespace, typically window.cartodb.
module.exports = function(opts) {
  opts = opts || {};
  var cdb = {};

  cdb.$ = opts.jQuery;
  cdb._ = _;
  cdb.Backbone = Backbone;
  cdb.Mustache = Mustache;
  cdb.L = Leaflet;
  Leaflet.noConflict(); // to remove window.L (and restore prev object if any)

  cdb.core = {};
  cdb.core.sanitize = sanitize;

  cdb.decorators = decorators;

  cdb.config = new Config();
  cdb.config.set({
    cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
    cartodb_logo_link: "http://www.cartodb.com"
  });

  // contains all error for the application
  cdb.errors = new ErrorList();
  cdb.log = new Log({tag: 'cdb'});

  cdb.Profiler = Profiler;

  cdb.core.Template = Template;
  cdb.core.TemplateList = TemplateList
  cdb.templates = new TemplateList();

  return cdb;
};
