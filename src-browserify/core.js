var _ = require('underscore');
var Mustache = require('mustache');
var reqwest = require('reqwest');

// TODO: jQuery itself is not required for the core, but if available it's preferred (for some reason) for the
// AJAX requests in the api/sql object - could we skip the need for jquery altogether to make things simpler?
var $ = window.$ || window.jQuery;
if ($) {
  require('jquery-proxy').set($);
  require('ajax-proxy').set($.ajax);
} else {
  require('ajax-proxy').set(reqwest.compat);
}

var Backbone = require('backbone-proxy').set(window.Backbone
    ? window.Backbone
    : require('./api/core-lib/backbone-isch')
  ).get();
var CARTOCSS_DEFAULT_VERSION = require('cartocss-default-version-proxy').set('2.1.1').get();
var cdb = require('cdb-proxy').set({}).get();

// These must be set after the proxied requires:
var util = require('./core/util');
var Profiler = require('./core/profiler');
var Tiles = require('./api/tiles');
var Loader = require('./core/loader');
var _Promise = require('./api/core-lib/_promise');
var Image = require('./vis/image');
var SQL = require('./api/sql');

cdb.VERSION = "3.15.8";
cdb.DEBUG = false;
cdb.CARTOCSS_VERSIONS = {
  '2.0.0': '',
  '2.1.0': ''
};
cdb.CARTOCSS_DEFAULT_VERSION = CARTOCSS_DEFAULT_VERSION;
cdb.config = {};

cdb.vis = {};
cdb.core = {};
cdb.core.Profiler = Profiler;
cdb.core.util = util;
cdb.core.Loader = cdb.vis.Loader = Loader;

cdb.Image = Image
cdb.Tiles = Tiles;
cdb.SQL = SQL;
cdb._Promise = _Promise;

window.cartodb = cdb;
if (!window.JST) window.JST = {};
if (!window._) window._ = _;
if (!window.Backbone) window.Backbone = Backbone;
if (!window.Mustache) window.Mustache = Mustache;

// TODO is it necessary to set reqwest on window? might not even be used if jQuery is available (see above)
window.reqwest = reqwest

module.exports = cdb;
