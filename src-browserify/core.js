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

var cdb = require('./cdb-common');

cdb.Tiles = require('./api/tiles');
cdb._Promise = require('./api/core-lib/_promise');

if (!window._) window._ = _;
if (!window.Backbone) window.Backbone = Backbone;
if (!window.Mustache) window.Mustache = Mustache;

// TODO is it necessary to set reqwest on window? might not even be used if jQuery is available (see above)
window.reqwest = reqwest

module.exports = cdb;
