// Create the cartodb object to be set in the global namespace, which includes to properly write up all dependencies.
// Code extracted from the older src/cartodb.js file (entry file prior to browerify)
// These definitions are shared for all bundles
var cdb = require('cdb-proxy').set({}).get();
cdb.VERSION = "3.15.8";
cdb.DEBUG = false;
cdb.CARTOCSS_DEFAULT_VERSION = require('cartocss-default-version-proxy').set('2.1.1').get();;
cdb.CARTOCSS_VERSIONS = {
  '2.0.0': '',
  '2.1.0': ''
};

cdb.config = {};
cdb.core = {};
cdb.image = {};
cdb.geo = {};
cdb.geo.ui = {};
cdb.geo.geocoder = {};
cdb.ui = {};
cdb.ui.common = {};
cdb.vis = {};
cdb.decorators = {};

cdb.core.Profiler = require('./core/profiler');
cdb.core.util = require('./core/util');
cdb.core.Loader = cdb.vis.Loader = require('./core/loader');

cdb.Image = require('./vis/image')
cdb.SQL = require('./api/sql');

if (!window.JST) window.JST = {};
window.cdb = window.cartodb = cdb;

module.exports = cdb;
