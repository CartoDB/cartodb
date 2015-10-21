var _ = require('underscore');
var BackboneIsch = require('backbone-isch');
var Mustache = require('mustache');
var setupLoader = require('./core/loader');
var Profiler = require('./core/profiler');
var util = require('./core/util');
var _Promise = require('_Promise');
var Image = require('./vis/image.js');
var SQL = require('./api/sql');
var Tiles = require('./api/tiles');
var reqwest = require('reqwest');

var cdb = {};
cdb.VERSION = "3.15.8";
cdb.DEBUG = false;
cdb.CARTOCSS_VERSIONS = {
  '2.0.0': '',
  '2.1.0': ''
};
cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';
cdb.config = {};

var Loader = setupLoader(cdb);

cdb.core = {};
cdb.core.Profiler = Profiler;
cdb.core.util = util;
cdb.core.Loader = Loader;

cdb.Image = Image;
cdb.SQL = SQL;
cdb.Tiles = Tiles;

cdb.vis = {};
cdb.vis.Loader = Loader;

cdb._Promise = _Promise;

if (typeof window !== 'undefined') {
  window.cartodb = cdb;

  if (!window.JST) window.JST = {};
  if (!window._) window._ = _;
  if (!window.Backbone) window.Backbone = BackboneIsch;
  if (!window.Mustache) window.Mustache = Mustache;

  // required by api/sql at global namespace at runtime
  window.reqwest = reqwest
}

module.exports = cdb;
