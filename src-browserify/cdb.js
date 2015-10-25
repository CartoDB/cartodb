// Create the cartodb object to be set in the global namespace, which includes to properly write up all dependencies.
// Code extracted from the older src/cartodb.js file (entry file prior to browerify)
var cdb = window.cdb = window.cartodb = require('cdb-proxy').set({
    core: {},
    vis: {}
  }).get();
cdb._ = require('underscore');
cdb.Mustache = require('mustache');
require('json2'); // TODO polyfills window.JSON, still necessary with modern browser?

cdb.$ = require('jquery-proxy').get();
cdb.Backbone = require('backbone-proxy').set(require('backbone')).get();

// These must be set after the proxied requires:
cdb.Profiler = require('cdb.core.profiler');
cdb.core.sanitize = require('./core/sanitize')
cdb.decorators = require('./core/decorators');
cdb.core.Template = require('./core/template');
cdb.core.Model = require('./core/model');
cdb.core.View = require('./core/view');
cdb.vis.Loader = cdb.core.Loader = require('./core/loader');
cdb.core.util = require('./core/util');
var Config = require('./core/config');
var ErrorList = require('./core/log/error-list');
var Log = require('./core/log');
var TemplateList = cdb.core.TemplateList = require('./core/template-list');

cdb.config = new Config();
cdb.config.set({
  cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
  cartodb_logo_link: "http://www.cartodb.com"
});

cdb.errors = new ErrorList();
cdb.log = new Log({tag: 'cdb'});

cdb.templates = new TemplateList();

module.exports = cdb;
