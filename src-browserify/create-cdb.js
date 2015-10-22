var _ = require('underscore');
require('json2'); // polyfills window.JSON if necessary
var Backbone = require('backbone');
var Mustache = require('mustache');
var Leaflet = require('leaflet');
var Profiler = require('cdb.core.profiler');
var sanitize = require('./core/sanitize')
var decorators = require('./core/decorators');
var Config = require('./core/config');
var setupLog = require('./core/log');
var setupError = require('./core/log/error');
var setupErrorList = require('./core/log/error-list');
var setupTemplate = require('./core/template');
var setupTemplateList = require('./core/template-list');
var setupModel = require('./core/model');
var setupView = require('./core/view');
var setupLoader = require('./core/loader');
var util = require('./core/util');

// Create the cartodb object to be set in the global namespace, which includes to properly write up all dependencies.
//
// Code extracted from the older src/cartodb.js file (entry file prior to browerify)
//
// @param {Object} opts (Optional)
//  jQuery: {Object}
// @return {Object} the object to be set in the global namespace, typically window.cartodb.
module.exports = function(opts) {
  opts = opts || {};
  var $ = opts.jQuery || window.jQuery || window.$;
  if (!$) throw new Error('jQuery is required for cdb.core.Model to work');

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
  cdb.Profiler = Profiler;

  cdb.config = new Config();
  cdb.config.set({
    cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
    cartodb_logo_link: "http://www.cartodb.com"
  });

  // contains all error for the application
  var ErrorModel = setupError($, cdb.config);
  var ErrorList = setupErrorList(ErrorModel);
  cdb.errors = new ErrorList();

  var Log = setupLog(cdb);
  cdb.log = new Log({tag: 'cdb'});

  var Template = setupTemplate(cdb.log);
  cdb.core.Template = Template;

  var TemplateList = setupTemplateList(Template, cdb.log);
  cdb.core.TemplateList = TemplateList
  cdb.templates = new TemplateList();

  cdb.core.Model = setupModel($);
  cdb.core.View = setupView(cdb.templates);

  cdb.vis = {};
  var Loader = setupLoader(cdb);
  cdb.vis.Loader = Loader;
  cdb.core.Loader = Loader;
  cdb.core.util = util;

  return cdb;
};
